// How a promo code turns into money off, in one place.
//
// This calculation used to be written out three times — the bag, the checkout
// page and /api/checkout — which was survivable while it was two lines. Adding
// category exclusions to three copies is how a customer ends up being quoted
// one discount on the bag and charged another at checkout, so all three now
// call this. No I/O and no server-only imports, so it runs on both sides and is
// unit-testable — same split as admin/promo-validate.ts.

/** The fields of a code the calculation actually needs. */
export type PromoRules = {
  percentageOff: number | null;
  amountOff: number | null;
  /** Category ids this code never discounts; empty means it applies to all. */
  excludedCategoryIds: string[];
};

/** The fields of a cart line the calculation actually needs. */
export type PromoLine = {
  categoryId: string;
  unitPrice: number;
  quantity: number;
};

const round2 = (n: number) => Number(n.toFixed(2));

/**
 * The part of the subtotal a code is allowed to discount.
 *
 * Lines in an excluded category are left out entirely — the code still works,
 * it just cannot see those items. A cart of nothing but excluded items gives
 * zero, which callers surface as "this code doesn't apply to anything in your
 * bag" rather than a silent $0.00 discount.
 */
export function eligibleSubtotal(lines: PromoLine[], excludedCategoryIds: string[]): number {
  if (excludedCategoryIds.length === 0) {
    return round2(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  }
  const excluded = new Set(excludedCategoryIds);
  return round2(
    lines.reduce(
      (sum, l) => (excluded.has(l.categoryId) ? sum : sum + l.unitPrice * l.quantity),
      0,
    ),
  );
}

/**
 * Money off, given the eligible portion of the subtotal.
 *
 * A percentage takes its cut of the eligible portion only. A fixed amount is
 * capped at the eligible portion too, so a $50-off code on a bag holding $20 of
 * eligible goods and $200 of excluded ones takes off $20, not $50 — the
 * exclusion would otherwise be trivially bypassed.
 */
export function discountFor(rules: PromoRules, eligible: number): number {
  if (eligible <= 0) return 0;
  if (rules.percentageOff != null) return round2((eligible * rules.percentageOff) / 100);
  if (rules.amountOff != null) return round2(Math.min(eligible, rules.amountOff));
  return 0;
}

/** eligibleSubtotal + discountFor, for the callers that need both. */
export function applyPromo(
  rules: PromoRules,
  lines: PromoLine[],
): { eligible: number; discount: number } {
  const eligible = eligibleSubtotal(lines, rules.excludedCategoryIds);
  return { eligible, discount: discountFor(rules, eligible) };
}
