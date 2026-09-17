// The reasons a customer can give when opening a return request. Lives here
// rather than in components/account/shared.tsx (a client module) so the
// server-rendered Returns Policy page can publish the same list the request
// form offers, without pulling client components into its graph.

// Owner's rule, 2026-09-16: returns are for OUR mistakes only. "Changed Mind"
// was removed, so nothing on the site comes back simply because the customer
// changed their mind — merchandise and accessories included, which previously
// kept a change-of-mind window.
export const RETURN_REASONS = [
  "Wrong Item Received",
  "Damaged Item",
  "Defective Item",
  "Other",
] as const;

/**
 * Days after delivery in which a return may be opened. Owner-confirmed on
 * 2026-08-15. A fault that could not reasonably have been found sooner is
 * still honoured after it — the policy says so. Lives in this light,
 * client-safe module rather than in returns-policy.ts so the cart and product
 * badges can state the window without pulling the whole policy document into
 * the browser bundle — the policy imports it from here.
 */
export const RETURN_WINDOW_DAYS = 14;

// Owner's rule, 2026-08-17: jewelry and aftercare are FINAL SALE once they
// leave the business. Not "returnable while sealed" — once it is out of our
// hands it does not come back, because we cannot verify how a piercing product
// was handled.
//
// Since 2026-09-16 this no longer changes WHETHER an item can be returned:
// nothing comes back for a change of mind, whatever its category. What it still
// decides is what the customer is TOLD — jewelry and aftercare are refused on
// hygiene grounds and the copy explains that, which would be the wrong reason
// to give for a tote bag.
//
// This is an allowlist, so a category nobody has classified yet is treated as
// final sale rather than silently promising a refund on it.
//
// Categories are database rows, so this matches on slug. Product.jewelryType
// is not usable here: `accessories` and `merch` are both seeded as the
// AFTERCARE catch-all, which would wrongly mark a tote bag final sale.
const RETURNABLE_CATEGORY_SLUGS = new Set(["accessories", "merch"]);

/**
 * Whether an item is refused on hygiene grounds specifically.
 *
 * Since change-of-mind returns were dropped everywhere, this no longer decides
 * what can be returned — it decides how the refusal is explained. Jewelry and
 * aftercare cannot come back because of the piercing-contact risk; merchandise
 * simply isn't taken back for preference.
 *
 * Neither ever applies to our own mistakes: an item that arrives damaged,
 * defective, or is not what was ordered is always replaced or refunded.
 */
export function isFinalSale(categorySlug: string): boolean {
  return !RETURNABLE_CATEGORY_SLUGS.has(categorySlug);
}

/**
 * Reasons a customer may choose when opening a return.
 *
 * Every reason describes something going wrong on our side, and those are
 * honoured on every category alike — so this no longer varies by category, as
 * it did while change-of-mind was offered on merchandise.
 */
export function allowedReasons(): string[] {
  return [...RETURN_REASONS];
}

/** Whether this reason may be submitted at all. */
export function isReasonAllowed(reason: string): boolean {
  return allowedReasons().includes(reason);
}
