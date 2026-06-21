// WiPay web-redirect landing endpoint.
//
// After the payor completes (or abandons) payment on WiPay's hosted page, WiPay
// redirects the browser here with the transaction result as a GET querystring.
// We resolve our order via `order_id` (= our orderNumber), verify the `hash`,
// and transition the PENDING order accordingly — then redirect the browser to a
// human page. The transition is idempotent (only a PENDING order is acted on),
// so a duplicate or replayed callback is safe.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getWipayConfig, verifyWipayHash } from "@/lib/checkout/wipay";
import { buildPlacedOrder } from "@/lib/checkout/order-view";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";

const ORDER_INCLUDE = {
  orderItems: {
    include: {
      product: { select: { id: true, name: true, material: true } },
      variant: { select: { id: true, value: true } },
    },
  },
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const status = (params.get("status") ?? "").toLowerCase();
  const orderNumber = params.get("order_id") ?? "";
  const transactionId = params.get("transaction_id") ?? "";
  const returnedHash = params.get("hash") ?? "";

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  if (!orderNumber) return redirectTo("/checkout?wipay=error");

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: ORDER_INCLUDE,
  });
  if (!order) return redirectTo("/checkout?wipay=error");

  // Idempotent: a non-PENDING order was already resolved by an earlier callback.
  if (order.paymentStatus !== "PENDING") {
    return redirectTo(
      order.paymentStatus === "PAID"
        ? `/checkout/confirmation?order=${encodeURIComponent(orderNumber)}`
        : "/cart?wipay=failed",
    );
  }

  const config = getWipayConfig();
  // The hash is computed over the EXACT total we sent in the request.
  const sentTotal = Number(order.total).toFixed(2);
  const hashOk = verifyWipayHash({
    config,
    transactionId,
    total: sentTotal,
    hash: returnedHash,
  });

  // ── Success + verified hash → mark PAID, send the confirmation email. ──
  if (status === "success" && hashOk) {
    // Claim the order by flipping PENDING → PAID only if it's still PENDING, so
    // concurrent or replayed success callbacks can't each send the email. Only
    // the callback that actually wins the flip (count === 1) emails the payor.
    const claimed = await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: "PENDING" },
      data: { paymentStatus: "PAID" },
    });

    if (claimed.count === 1) {
      const placed = buildPlacedOrder(order);
      const emailResult = await sendOrderConfirmationEmail({
        to: placed.contact.email,
        name: `${placed.contact.firstName} ${placed.contact.lastName}`.trim(),
        order: {
          orderNumber: placed.orderNumber,
          items: placed.items.map((i) => ({
            name: i.name,
            variant: i.variant,
            qty: i.qty,
            price: i.price,
          })),
          subtotal: placed.subtotal,
          discount: placed.discount,
          shipLabel: placed.shipLabel,
          shipFee: placed.shipFee,
          total: placed.total,
          paymentLabel: placed.paymentLabel,
          eta: placed.eta,
          shipTo: placed.shipTo,
        },
      });
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[wipay] order ${orderNumber} PAID (txn ${transactionId}); email → ${placed.contact.email}: ${emailResult.ok ? "sent" : `skipped (${emailResult.error})`}`,
        );
      }
    }

    return redirectTo(`/checkout/confirmation?order=${encodeURIComponent(orderNumber)}`);
  }

  // ── Success but the hash didn't verify → don't trust it. Leave the order ──
  // PENDING for manual review (the payor may genuinely have been charged) and
  // do NOT restock. Surface a "contact support" state.
  if (status === "success" && !hashOk) {
    console.warn(
      `[wipay] order ${orderNumber} returned success with an INVALID hash (txn ${transactionId}) — left PENDING for review.`,
    );
    return redirectTo("/checkout?wipay=error");
  }

  // ── Failed / error → release everything so the payor can retry. ──
  // WiPay does NOT sign failure callbacks (the `hash` is success-only per the
  // v1.0.8 spec), so this branch can't be verified cryptographically. Gate the
  // destructive cleanup on the order owner's session instead: WiPay redirects
  // the payor's own browser here (a top-level GET, so the SameSite=Lax session
  // cookie rides along). A forged or cross-user callback has no matching
  // session, so it can't cancel/restock someone else's order — we just redirect
  // and leave the order PENDING untouched.
  const session = await auth();
  if (session?.user?.id !== order.userId) {
    return redirectTo("/cart?wipay=failed");
  }

  // Mark FAILED, restock the reserved inventory, rebuild their cart from the
  // order items, and release the promo's usage count. All in one transaction
  // and guarded on PENDING, so it can't double-apply.
  let promoCode: string | null = null;
  try {
    promoCode = (JSON.parse(order.notes ?? "{}") as { promo?: string | null }).promo ?? null;
  } catch {
    promoCode = null;
  }

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.order.findUnique({
      where: { id: order.id },
      select: { paymentStatus: true },
    });
    if (fresh?.paymentStatus !== "PENDING") return; // lost the race; already resolved

    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED", fulfillmentStatus: "CANCELLED" },
    });

    // Reverse the stock decrement made at order creation.
    for (const item of order.orderItems) {
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

    // Rebuild the cart so the payor can try again with their bag intact.
    const cart = await tx.cart.upsert({
      where: { userId: order.userId },
      create: { userId: order.userId },
      update: {},
    });
    for (const item of order.orderItems) {
      const existing = await tx.cartItem.findFirst({
        where: { cartId: cart.id, productId: item.productId, variantId: item.variantId },
        select: { id: true, quantity: true },
      });
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        });
      }
    }

    // Release the promo redemption counted at order creation.
    if (promoCode) {
      await tx.discountCode.updateMany({
        where: { code: promoCode, timesUsed: { gt: 0 } },
        data: { timesUsed: { decrement: 1 } },
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[wipay] order ${orderNumber} FAILED (status="${status}", txn ${transactionId}) — restocked + cart rebuilt.`,
    );
  }

  return redirectTo("/cart?wipay=failed");
}
