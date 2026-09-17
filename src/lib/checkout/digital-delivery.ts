import "server-only";
import { prisma } from "@/lib/db";
import { sendDigitalReadyEmail } from "@/lib/email/resend";
import { isDigitalFileKey } from "@/lib/storage/r2";

// Telling a buyer their download is ready.
//
// Payment is confirmed in three different places — the WiPay callback, an
// admin approving a bank transfer, and an admin marking a COD order paid — so
// this lives here rather than in any one of them.

export type DigitalLine = { name: string };

type MaybeDigitalItem = {
  product: { name: string; isDigital: boolean; digitalFileKey: string | null };
};

/**
 * The downloadable lines of an order.
 *
 * A product flagged digital but missing (or holding an unservable) key is not
 * counted: the download route would refuse it, and promising a file we cannot
 * serve is worse than staying quiet.
 */
export function digitalLinesOf(items: readonly MaybeDigitalItem[]): DigitalLine[] {
  return items
    .filter(
      (it) =>
        it.product.isDigital &&
        !!it.product.digitalFileKey &&
        isDigitalFileKey(it.product.digitalFileKey),
    )
    .map((it) => ({ name: it.product.name }));
}

/**
 * Where a buyer opens the order holding their download.
 *
 * `baseUrl` should be the request's own origin where a caller has one:
 * NEXT_PUBLIC_SITE_URL is not set in every environment, and a relative link in
 * an email is useless.
 */
export function orderPageUrl(orderNumber: string, baseUrl?: string): string {
  const base = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return `${base}/account?view=orders&order=${encodeURIComponent(orderNumber)}`;
}

export type UnlockResult = {
  /** The order is paid and holds at least one servable download. */
  unlocked: boolean;
  digitalItems: number;
  emailed: boolean;
};

/**
 * Idempotent "your download is ready" notification.
 *
 * Safe to call from every payment-confirmation site, including a replayed
 * gateway callback: at most one email goes out per order, claimed by a
 * conditional update on `digitalNotifiedAt`.
 *
 * Call it AFTER the status flip has committed and OUTSIDE that transaction —
 * called earlier it reads PENDING and no-ops, and called inside it cannot see
 * the uncommitted write while holding a connection open for network I/O.
 *
 * Never throws, and never gates the download itself: access is re-derived per
 * request by the download route, so a failed email costs the buyer nothing.
 */
export async function unlockDigitalDownloads(
  orderId: string,
  opts?: { baseUrl?: string },
): Promise<UnlockResult> {
  const idle: UnlockResult = { unlocked: false, digitalItems: 0, emailed: false };
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        paymentStatus: true,
        shipName: true,
        shipEmail: true,
        user: { select: { name: true, email: true } },
        orderItems: {
          select: {
            product: { select: { name: true, isDigital: true, digitalFileKey: true } },
          },
        },
      },
    });
    if (!order || order.paymentStatus !== "PAID") return idle;

    const digital = digitalLinesOf(order.orderItems);
    if (digital.length === 0) return idle;

    // Claim the notification. Re-checking PAID here closes the window where the
    // status changed between the read above and this write.
    const claimed = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: "PAID", digitalNotifiedAt: null },
      data: { digitalNotifiedAt: new Date() },
    });
    if (claimed.count !== 1) {
      return { unlocked: true, digitalItems: digital.length, emailed: false };
    }

    const to = order.shipEmail ?? order.user.email;
    if (!to) {
      console.error(
        `[digital] order ${order.orderNumber} is paid and holds a download, but has no email address`,
      );
      return { unlocked: true, digitalItems: digital.length, emailed: false };
    }

    const result = await sendDigitalReadyEmail({
      to,
      name: order.shipName ?? order.user.name,
      orderNumber: order.orderNumber,
      orderUrl: orderPageUrl(order.orderNumber, opts?.baseUrl),
      items: digital,
    });
    if (!result.ok) {
      // Deliberately not rolling the claim back: a permanently bad address
      // would turn every retry into another send attempt. The buyer can still
      // download from their order page, which is what the email only points at.
      console.error(
        `[digital] download-ready email for ${order.orderNumber} failed: ${result.error}`,
      );
    }
    return { unlocked: true, digitalItems: digital.length, emailed: result.ok };
  } catch (e) {
    console.error("[digital] unlockDigitalDownloads failed for order", orderId, e);
    return idle;
  }
}
