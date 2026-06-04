import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { firstName, lastName, email, phone } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof firstName !== "string" || !firstName.trim()) {
    return NextResponse.json({ error: "First name is required." }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }
  const last = typeof lastName === "string" ? lastName.trim() : "";
  const normalizedEmail = email.toLowerCase();

  // Guard the unique email constraint with a friendly message.
  if (normalizedEmail !== session.user.email?.toLowerCase()) {
    const clash = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (clash && clash.id !== session.user.id) {
      return NextResponse.json(
        { error: "That email is already in use." },
        { status: 409 },
      );
    }
  }

  const name = [firstName.trim(), last].filter(Boolean).join(" ");
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: firstName.trim(),
      lastName: last || null,
      name,
      email: normalizedEmail,
      phoneNumber: phone.trim(),
    },
    select: { firstName: true, lastName: true, name: true, email: true, phoneNumber: true },
  });

  return NextResponse.json({
    ok: true,
    profile: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      name: user.name ?? name,
      email: user.email,
      phone: user.phoneNumber ?? "",
    },
  });
}
