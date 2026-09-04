// The reasons a customer can give when opening a return request. Lives here
// rather than in components/account/shared.tsx (a client module) so the
// server-rendered Returns Policy page can publish the same list the request
// form offers, without pulling client components into its graph.

export const RETURN_REASONS = [
  "Wrong Item Received",
  "Damaged Item",
  "Defective Item",
  "Changed Mind",
  "Other",
] as const;

/**
 * Days after delivery in which a return may be opened — for the categories that
 * accept returns at all. Owner-confirmed on 2026-08-15. Lives in this light,
 * client-safe module rather than in returns-policy.ts so the cart and product
 * badges can state the window without pulling the whole policy document into
 * the browser bundle — the policy imports it from here.
 */
export const RETURN_WINDOW_DAYS = 14;

// Owner's rule, 2026-08-17: jewelry and aftercare are FINAL SALE once they
// leave the business. Not "returnable while sealed" — once it is out of our
// hands it does not come back, because we cannot verify how a piercing product
// was handled. Merchandise and accessories carry no such risk and stay
// returnable while unused.
//
// This is an allowlist, so a category nobody has classified yet is treated as
// final sale rather than silently promising a refund on it.
//
// Categories are database rows, so this matches on slug. Product.jewelryType
// is not usable here: `accessories` and `merch` are both seeded as the
// AFTERCARE catch-all, which would wrongly mark a tote bag final sale.
const RETURNABLE_CATEGORY_SLUGS = new Set(["accessories", "merch"]);

/**
 * Whether an item is final sale — no change-of-mind return once it has left us.
 *
 * This never applies to our own mistakes: an item that arrives damaged,
 * defective, or is not what was ordered is always replaced or refunded, final
 * sale or not. Callers stating this to a customer must say so alongside.
 */
export function isFinalSale(categorySlug: string): boolean {
  return !RETURNABLE_CATEGORY_SLUGS.has(categorySlug);
}

/** The one reason that is a change of mind rather than a fault on our side. */
export const CHANGE_OF_MIND_REASON = "Changed Mind";

/**
 * Reasons a customer may choose for a given item.
 *
 * On a final-sale item, change-of-mind is not offered: the policy already
 * refuses it, so accepting the request would only create a refusal to write.
 * Every other reason describes something going wrong on our side, and those are
 * honoured on final-sale items exactly like anything else.
 */
export function allowedReasonsFor(categorySlug: string): string[] {
  const all = [...RETURN_REASONS];
  return isFinalSale(categorySlug)
    ? all.filter((r) => r !== CHANGE_OF_MIND_REASON)
    : all;
}

/** Whether this reason may be submitted against an item in this category. */
export function isReasonAllowed(categorySlug: string, reason: string): boolean {
  return allowedReasonsFor(categorySlug).includes(reason);
}
