import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { toAccountAddress } from "@/lib/queries/account";

type AddressInput = {
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  region?: unknown;
  postal?: unknown;
  country?: unknown;
  isDefault?: unknown;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function validate(input: AddressInput): string | null {
  if (!str(input.firstName)) return "First name is required.";
  if (!str(input.line1)) return "Address line 1 is required.";
  if (!str(input.city)) return "City is required.";
  return null;
}

function toData(input: AddressInput) {
  const fullName = [str(input.firstName), str(input.lastName)]
    .filter(Boolean)
    .join(" ");
  return {
    fullName,
    phoneNumber: str(input.phone),
    addressLine1: str(input.line1),
    addressLine2: str(input.line2) || null,
    city: str(input.city),
    region: str(input.region),
    postalCode: str(input.postal) || null,
    country: str(input.country) || "Trinidad and Tobago",
  };
}

async function listFor(userId: string) {
  const rows = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return rows.map(toAccountAddress);
}

// Create a new address.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const input = (await request.json().catch(() => ({}))) as AddressInput;
  const err = validate(input);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const existingCount = await prisma.address.count({
    where: { userId: session.user.id },
  });
  // First address (or one explicitly flagged) becomes the sole default.
  const makeDefault = existingCount === 0 || input.isDefault === true;

  await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId: session.user!.id },
        data: { isDefault: false },
      });
    }
    await tx.address.create({
      data: { ...toData(input), isDefault: makeDefault, userId: session.user!.id },
    });
  });

  return NextResponse.json({ ok: true, addresses: await listFor(session.user.id) });
}

// Update an existing address, or flip the default via { id, makeDefault: true }.
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as AddressInput & {
    id?: unknown;
    makeDefault?: unknown;
  };
  const id = str(body.id);
  if (!id) return NextResponse.json({ error: "Address id is required." }, { status: 400 });

  const owned = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  if (body.makeDefault === true) {
    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return NextResponse.json({ ok: true, addresses: await listFor(session.user.id) });
  }

  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  await prisma.address.update({ where: { id }, data: toData(body) });
  return NextResponse.json({ ok: true, addresses: await listFor(session.user.id) });
}

// Delete an address; promote the first remaining one if the default was removed.
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Address id is required." }, { status: 400 });

  const target = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, isDefault: true },
  });
  if (!target) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  await prisma.address.delete({ where: { id } });

  if (target.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (next) {
      await prisma.address.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  return NextResponse.json({ ok: true, addresses: await listFor(session.user.id) });
}
