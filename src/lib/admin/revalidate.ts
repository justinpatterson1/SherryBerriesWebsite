import "server-only";
import { revalidatePath } from "next/cache";

// Cache invalidation for admin writes.
//
// Most of the storefront is server-rendered per request (`ƒ` in the build
// output) and needs nothing here. But two pages are PRERENDERED at build time
// (`○`) while reading catalog data, so their HTML is frozen as of the last
// deploy and an admin edit would not appear until the next one:
//
//   /             — the category grid and the Bestsellers strip
//   /bestsellers  — every featured product
//
// Every other prerendered page (/cart, /contact, /help/*, /learn/sizing,
// /our-story, /privacy, /terms, /login, /forgot-password) is copy only, so it
// cannot go stale from a database write.
//
// Called from a Route Handler, revalidatePath MARKS the path: the re-render
// happens on the next visit rather than immediately. That is the behaviour we
// want — a burst of admin edits costs one render, not one per save.

/**
 * Invalidate the prerendered pages that read products.
 *
 * Covers a product's name, price, image, featured flag, active flag and stock —
 * anything that shows on a card. Both pages are refreshed rather than just the
 * one that obviously changed, because `featured: true` decides which products
 * appear on both, so a single edit can add or remove a card from either.
 */
export function revalidateCatalog(): void {
  revalidatePath("/");
  revalidatePath("/bestsellers");
}

/**
 * Invalidate the prerendered pages that read categories.
 *
 * Only the homepage renders category tiles — /bestsellers selects products by
 * `featured` and never reads a category — so this is deliberately narrower than
 * revalidateCatalog(). /products reads the same rows but is server-rendered, so
 * it was always current; that mismatch is what made the bug confusing.
 */
export function revalidateCategories(): void {
  revalidatePath("/");
}
