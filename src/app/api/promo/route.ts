import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export type PromoSuccess = {
  ok: true;
  code: string;
  percentageOff: number | null;
  amountOff: number | null;
  label: string;
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const raw = (body as { code?: unknown })?.code;
  if (typeof raw !== "string" || !raw.trim()) {
    return NextResponse.json({ error: "Promo code is required." }, { status: 400 });
  }
  const code = raw.trim().toUpperCase();

  const row = await prisma.discountCode.findUnique({ where: { code } });
  if (!row || !row.active) {
    return NextResponse.json(
      { error: "Hmm, that code didn't work." },
      { status: 404 },
    );
  }
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "That code has expired." }, { status: 410 });
  }
  if (row.usageLimit != null && row.timesUsed >= row.usageLimit) {
    return NextResponse.json(
      { error: "That code has reached its limit." },
      { status: 410 },
    );
  }

  const percentageOff = row.percentageOff ?? null;
  const amountOff = row.amountOff ? Number(row.amountOff) : null;
  const label = percentageOff
    ? `${percentageOff}% off`
    : amountOff
    ? `$${amountOff.toFixed(2)} off`
    : "discount";

  return NextResponse.json({
    ok: true,
    code: row.code,
    percentageOff,
    amountOff,
    label,
  } satisfies PromoSuccess);
}
