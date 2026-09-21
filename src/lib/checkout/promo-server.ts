import "server-only";
import { prisma } from "@/lib/db";
import type { PromoRules } from "@/lib/checkout/promo";

// The one place that decides whether a customer may use a code right now.
//
// /api/promo (applying it to the bag) and /api/checkout (placing the order)
// both call this, so the message shown when a code is refused is the same in
// both, and neither can drift into accepting something the other rejects. The
// pure arithmetic lives in ./promo.ts; everything here needs the database.

export type UsablePromo = {
  id: string;
  code: string;
  /**
   * The total limit this lookup checked against, or null for unlimited.
   *
   * Handed back so the caller can re-assert it atomically when it redeems the
   * code — this read is only a pre-check, and by the time an order commits the
   * count may have moved.
   */
  usageLimit: number | null;
  /**
   * The per-customer limit this lookup checked against, or null for unlimited.
   * Re-asserted when the code is redeemed, for the same reason as usageLimit.
   */
  perUserLimit: number | null;
  rules: PromoRules;
};

export type PromoLookup =
  | { ok: true; promo: UsablePromo }
  | { ok: false; status: 404 | 410; error: string };

/**
 * Load a code and check every gate that does not depend on the cart.
 *
 * `userId` is what makes the per-customer check possible. It is optional only
 * because the bag's promo box can be used before signing in; a signed-out
 * shopper gets the code provisionally and is re-checked at checkout, which
 * requires an account anyway. That is a deliberate soft edge: refusing to
 * validate at all until sign-in would be a worse first impression than telling
 * them at checkout, and checkout is the gate that actually holds.
 */
export async function loadUsablePromo(
  rawCode: string,
  userId: string | null,
): Promise<PromoLookup> {
  const code = rawCode.trim().toUpperCase();

  const row = await prisma.discountCode.findUnique({
    where: { code },
    include: { excludedCategories: { select: { id: true } } },
  });
  if (!row || !row.active) {
    return { ok: false, status: 404, error: "Hmm, that code didn't work." };
  }
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return { ok: false, status: 410, error: "That code has expired." };
  }
  if (row.usageLimit != null && row.timesUsed >= row.usageLimit) {
    return { ok: false, status: 410, error: "That code has reached its limit." };
  }

  if (userId && row.perUserLimit != null) {
    const mine = await prisma.discountRedemption.count({
      where: { codeId: row.id, userId },
    });
    if (mine >= row.perUserLimit) {
      return {
        ok: false,
        status: 410,
        error:
          row.perUserLimit === 1
            ? "You've already used this code."
            : `You've already used this code ${row.perUserLimit} times.`,
      };
    }
  }

  return {
    ok: true,
    promo: {
      id: row.id,
      code: row.code,
      usageLimit: row.usageLimit,
      perUserLimit: row.perUserLimit,
      rules: {
        percentageOff: row.percentageOff ?? null,
        amountOff: row.amountOff ? Number(row.amountOff) : null,
        excludedCategoryIds: row.excludedCategories.map((c) => c.id),
      },
    },
  };
}
