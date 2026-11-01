// Pure rules for preorder products.
//
// No I/O and no server-only imports, so the cart API, the checkout API and the
// cart and checkout UI all apply exactly the same rule — the same reason
// digital.ts exists.

export type PreorderFlagged = { isPreorder: boolean };

/** True when any line in the cart is a preorder. */
export function hasPreorder(lines: readonly PreorderFlagged[]): boolean {
  return lines.some((l) => l.isPreorder);
}

/**
 * True when a cart holds both preorder and regular lines.
 *
 * Preorders are checked out on their own: they wait on stock that has not
 * arrived and cannot be paid cash on delivery, so mixing them in would hold
 * back, and change the payment terms of, pieces that are ready to go.
 */
export function isMixedPreorderCart(lines: readonly PreorderFlagged[]): boolean {
  return hasPreorder(lines) && lines.some((l) => !l.isPreorder);
}

/**
 * Whether a line skips inventory entirely — no stock check, no decrement at
 * checkout, nothing given back on release. A file cannot sell out, and a
 * preorder is sold before the stock exists.
 */
export function ignoresStock(line: { isDigital: boolean; isPreorder: boolean }): boolean {
  return line.isDigital || line.isPreorder;
}
