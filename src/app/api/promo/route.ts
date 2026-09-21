import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadUsablePromo } from "@/lib/checkout/promo-server";
import {
  checkRateLimit,
  getClientIp,
  promoLimiter,
  tooManyRequests,
} from "@/lib/rate-limit";

export type PromoSuccess = {
  ok: true;
  code: string;
  percentageOff: number | null;
  amountOff: number | null;
  /** Categories this code does not discount; the bag computes around them. */
  excludedCategoryIds: string[];
  label: string;
};

// Rate-limited because this endpoint tells anyone whether a code exists, and
// our codes are guessable words. Limiting is what makes guessing expensive —
// the wording below stays specific on purpose, since a customer holding a
// genuinely expired code should be told that rather than "didn't work".
export async function POST(request: Request) {
  const rl = await checkRateLimit(promoLimiter, getClientIp(request));
  if (!rl.success) return tooManyRequests(rl.reset);

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
  const session = await auth();
  const found = await loadUsablePromo(raw, session?.user?.id ?? null);
  if (!found.ok) {
    return NextResponse.json({ error: found.error }, { status: found.status });
  }
  const { code: codeName, rules } = found.promo;

  const label = rules.percentageOff
    ? `${rules.percentageOff}% off`
    : rules.amountOff
    ? `$${rules.amountOff.toFixed(2)} off`
    : "discount";

  return NextResponse.json({
    ok: true,
    code: codeName,
    percentageOff: rules.percentageOff,
    amountOff: rules.amountOff,
    excludedCategoryIds: rules.excludedCategoryIds,
    label,
  } satisfies PromoSuccess);
}
