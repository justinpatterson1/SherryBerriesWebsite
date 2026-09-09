import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { EXPIRABLE_STATUSES, isExpired } from "@/lib/checkout/bank-transfer";
import { releaseOrderStock } from "@/lib/checkout/release-stock";

// Expiry for bank transfer orders whose payment window has closed.
//
// There is no cron in this project (see the note in lib/admin/audit.ts) and no
// vercel.json, so expiry is driven by reads:
//
//   1. expireOrderIfDue() — before showing ONE order to anyone. The customer on
//      the payment page and the receipt upload both call it, so nobody can act
//      on an order that has actually lapsed.
//   2. sweepExpiredOrders() — awaited when the admin payments queue is built.
//      That read already loads every bank transfer order, so it is the natural
//      place to settle them, and an admin can afford the few milliseconds.
//
// Deliberately NOT a fire-and-forget background sweep: an un-awaited promise in
// a server component can be killed when the response finishes, which makes it
// look like housekeeping is running when it may not be.
//
// Two rules from the spec live in isExpired() rather than here:
//   - PAYMENT_SUBMITTED never expires on the clock (§18). A receipt filed at
//     10:55 for an 11:00 deadline must not be cancelled at 11:00 — the customer
//     met the deadline and the delay is ours.
//   - REJECTED does expire, on the fresh window set when it was rejected, so a
//     refused order cannot hold its stock indefinitely.

/** Bounded so one request cannot expire thousands of orders inline. */
const SWEEP_BATCH = 25;

const RELEASE_SELECT = {
  id: true,
  orderNumber: true,
  notes: true,
  paymentStatus: true,
  paymentExpiresAt: true,
  orderItems: {
    select: { productId: true, variantId: true, quantity: true },
  },
} as const;

type ReleasableOrder = {
  id: string;
  orderNumber: string;
  notes: string | null;
  paymentStatus: string;
  orderItems: { productId: string; variantId: string | null; quantity: number }[];
};

/**
 * Mark one order EXPIRED and give back everything it was holding.
 *
 * The status flip is a guarded updateMany inside the transaction, so two
 * concurrent callers — a page read and the admin sweep, say — cannot both
 * restock it. The loser updates 0 rows and does nothing.
 *
 * Returns true only if this call is the one that expired it.
 */
async function expireOne(order: ReleasableOrder): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: order.id,
        // Re-checked here and not just at the read: the status may have moved
        // between the two (a receipt arriving, an admin confirming).
        paymentStatus: { in: [...EXPIRABLE_STATUSES] },
      },
      data: {
        paymentStatus: "EXPIRED",
        fulfillmentStatus: "CANCELLED",
      },
    });
    if (claimed.count !== 1) return false;

    // Shared with the WiPay failure path — see lib/checkout/release-stock.ts.
    await releaseOrderStock(tx, order);

    await writeExpiryLog(tx, order);
    return true;
  });
}

/**
 * Audit the expiry.
 *
 * Written inside the same transaction as the change, like every other audited
 * write. The actor is the system — nobody chose this — so it records a synthetic
 * actor rather than a real user id. `actorId` has no foreign key, so "system" is
 * a safe value. No customer personal data is copied in.
 */
async function writeExpiryLog(
  tx: Prisma.TransactionClient,
  order: { id: string; orderNumber: string; paymentStatus: string },
): Promise<void> {
  const because =
    order.paymentStatus === "REJECTED"
      ? "no new receipt after the payment was rejected"
      : "the payment window closed with no receipt";

  await tx.adminAuditLog.create({
    data: {
      actorId: "system",
      actorEmail: "system@sherryberries",
      action: "payment.expired",
      entityType: "Order",
      entityId: order.id,
      summary: `${order.orderNumber}: cancelled and restocked — ${because}`,
      changes: { paymentStatus: { from: order.paymentStatus, to: "EXPIRED" } },
    },
  });
}

/**
 * Expire this one order if its window has closed. Call before showing an order
 * to anyone, or before letting them act on it.
 *
 * Cheap when there is nothing to do: one indexed read and no transaction.
 */
export async function expireOrderIfDue(orderId: string, now: Date = new Date()): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: RELEASE_SELECT,
  });
  if (!order) return false;
  if (!isExpired(order.paymentStatus, order.paymentExpiresAt, now)) return false;
  return expireOne(order);
}

/**
 * Expire every order whose window has closed, up to a batch.
 *
 * The status filter is what makes this correct rather than the timestamp alone:
 * a PAYMENT_SUBMITTED order can sit long past its deadline and must be left for
 * an admin to review.
 *
 * Returns how many were expired, so a caller can log it.
 */
export async function sweepExpiredOrders(now: Date = new Date()): Promise<number> {
  const due = await prisma.order.findMany({
    where: {
      paymentStatus: { in: [...EXPIRABLE_STATUSES] },
      paymentExpiresAt: { lte: now },
    },
    orderBy: { paymentExpiresAt: "asc" },
    take: SWEEP_BATCH,
    select: RELEASE_SELECT,
  });
  if (due.length === 0) return 0;

  let expired = 0;
  for (const order of due) {
    if (await expireOne(order)) expired += 1;
  }
  return expired;
}
