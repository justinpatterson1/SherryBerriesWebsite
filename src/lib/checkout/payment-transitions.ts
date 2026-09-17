// Pure rules about which payment transitions an admin may make by hand.
//
// No Prisma and no server-only import, so the route and the admin UI can agree
// on when a button is offered without duplicating the condition.

/**
 * Whether an order can be marked paid by hand.
 *
 * Only PENDING qualifies — that is cash on delivery once the money is
 * collected, or a card order whose callback never arrived. A bank transfer is
 * excluded on purpose: it goes through /api/admin/payments so the receipt is
 * stamped ACCEPTED and the customer gets the confirmation email that belongs
 * to that flow. Everything else is already resolved.
 */
export function canMarkPaid(paymentStatus: string): boolean {
  return paymentStatus === "PENDING";
}

/**
 * Whether a purchased download should be served.
 *
 * Paid, flagged digital, and actually holding a file. The download route
 * re-derives this per request rather than trusting anything stored alongside
 * the order.
 */
export function canDownloadDigital(
  paymentStatus: string,
  isDigital: boolean,
  hasKey: boolean,
): boolean {
  return paymentStatus === "PAID" && isDigital && hasKey;
}
