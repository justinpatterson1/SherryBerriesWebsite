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

// The hygiene exclusion published in the Terms of Service and the Returns
// Policy: nothing worn in or applied to a piercing can come back once it has
// been unsealed. That covers everything we sell except the two categories
// below, so this is an allowlist — a category nobody has classified yet is
// treated as excluded rather than silently promising a refund on it.
//
// Categories are database rows, so this matches on slug. Product.jewelryType
// is not usable here: `accessories` and `merch` are both seeded as the
// AFTERCARE catch-all, which would wrongly exclude a tote bag.
const RESALABLE_CATEGORY_SLUGS = new Set(["accessories", "merch"]);

/**
 * Whether an item is covered by the hygiene exclusion once its packaging has
 * been opened. Advisory only — a damaged, defective, or incorrect item is
 * always returnable regardless of what this returns.
 */
export function isHygieneExcluded(categorySlug: string): boolean {
  return !RESALABLE_CATEGORY_SLUGS.has(categorySlug);
}
