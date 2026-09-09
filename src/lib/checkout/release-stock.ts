import "server-only";
import type { Prisma } from "@/generated/prisma/client";

// Giving back what an unpaid order was holding.
//
// Stock is consumed at checkout rather than held in a reservation table, so
// "releasing a reservation" means incrementing it back, and the promo
// redemption counted at the same moment has to be given back with it.
//
// Two callers need exactly this, which is why it lives here rather than in
// either of them:
//
//   - the WiPay failure callback, when a card payment fails
//   - bank transfer expiry, when a payment window closes
//
// What differs between them stays at the call site: WiPay also rebuilds the
// customer's cart, which is right when they are present and mid-checkout, and
// wrong hours later from a sweep someone else's request triggered.

export type ReleasableItems = {
  /** The order's `notes` JSON, which carries the promo code applied at checkout. */
  notes: string | null;
  orderItems: { productId: string; variantId: string | null; quantity: number }[];
};

/** The promo code recorded on the order at checkout, if any. */
export function promoFromNotes(notes: string | null): string | null {
  try {
    return (JSON.parse(notes ?? "{}") as { promo?: string | null }).promo ?? null;
  } catch {
    return null;
  }
}

/**
 * Return an order's items to stock and release its promo redemption.
 *
 * Must be called inside the transaction that also settles the order's status,
 * and only by a caller that has already claimed the transition — otherwise two
 * concurrent releases would each increment the stock.
 */
export async function releaseOrderStock(
  tx: Prisma.TransactionClient,
  order: ReleasableItems,
): Promise<void> {
  for (const item of order.orderItems) {
    // Variant stock when the line chose one, product stock otherwise — the same
    // split the checkout decrement uses.
    if (item.variantId) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { inventory: { increment: item.quantity } },
      });
    } else {
      await tx.product.update({
        where: { id: item.productId },
        data: { inventory: { increment: item.quantity } },
      });
    }
  }

  const promoCode = promoFromNotes(order.notes);
  if (promoCode) {
    // Guarded above zero so a double release cannot drive the counter negative.
    await tx.discountCode.updateMany({
      where: { code: promoCode, timesUsed: { gt: 0 } },
      data: { timesUsed: { decrement: 1 } },
    });
  }
}
