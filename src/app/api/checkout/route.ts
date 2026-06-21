import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  PAYMENT_LABEL,
  SHIPPING,
  isPaymentKey,
  isShippingKey,
} from "@/lib/checkout/shipping";
import { getWipayConfig, requestHostedPage } from "@/lib/checkout/wipay";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";
import type { Order } from "@/generated/prisma/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const round2 = (n: number) => Number(n.toFixed(2));

// Thrown inside the order transaction when a conditional stock decrement finds
// no row with enough inventory left — rolls the whole order back.
class OversoldError extends Error {
  constructor(public itemName: string) {
    super("oversold");
  }
}

async function uniqueOrderNumber(): Promise<string> {
  // Matches the seed's `SB-` + 8-digit convention; retries on the rare clash.
  for (let attempt = 0; attempt < 5; attempt++) {
    const n = `SB-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const existing = await prisma.order.findUnique({
      where: { orderNumber: n },
      select: { id: true },
    });
    if (!existing) return n;
  }
  return `SB-${Date.now().toString().slice(-8)}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to check out." }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const contact = (b.contact ?? {}) as Record<string, unknown>;
  const address = (b.address ?? {}) as Record<string, unknown>;

  const firstName = str(contact.firstName);
  const lastName = str(contact.lastName);
  const email = str(contact.email);
  const phone = str(contact.phone);
  const line1 = str(address.line1);
  const city = str(address.city);
  const landmark = str(address.landmark);

  // Server-side mirror of the client validation.
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  }
  if (!line1 || !city) {
    return NextResponse.json({ error: "A shipping address is required." }, { status: 400 });
  }
  if (!isShippingKey(b.shipping)) {
    return NextResponse.json({ error: "Choose a shipping method." }, { status: 400 });
  }
  if (!isPaymentKey(b.payment)) {
    return NextResponse.json({ error: "Choose a payment method." }, { status: 400 });
  }
  const shipping = SHIPPING[b.shipping];
  const paymentKey = b.payment;

  // Authoritative cart read — never trust client-supplied prices/quantities.
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      cartItems: {
        include: {
          product: { select: { id: true, name: true, price: true, inventory: true, material: true } },
          variant: {
            select: { id: true, value: true, additionalPrice: true, inventory: true },
          },
        },
      },
    },
  });

  if (!cart || cart.cartItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Stock check + line/total computation from DB prices.
  const lines = cart.cartItems.map((it) => {
    const unitPrice =
      Number(it.product.price) + Number(it.variant?.additionalPrice ?? 0);
    const available = it.variant ? it.variant.inventory : it.product.inventory;
    const variantLabel = [it.product.material, it.variant?.value]
      .filter(Boolean)
      .join(" · ") || null;
    return {
      productId: it.productId,
      variantId: it.variantId,
      name: it.product.name,
      variant: variantLabel,
      quantity: it.quantity,
      unitPrice,
      available,
    };
  });

  // Fast, friendly pre-check for the common case. This is NOT the correctness
  // gate — the authoritative guard is the atomic conditional decrement inside
  // the transaction below (this read can go stale under concurrent orders).
  const oversold = lines.find((l) => l.quantity > l.available);
  if (oversold) {
    return NextResponse.json(
      {
        error:
          oversold.available <= 0
            ? `${oversold.name} just sold out — please remove it from your bag.`
            : `Only ${oversold.available} of ${oversold.name} left — please lower the quantity.`,
      },
      { status: 409 },
    );
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));

  // Re-validate the promo against the DB; silently drop it if no longer valid
  // rather than blocking the order.
  let discount = 0;
  let appliedPromo: { id: string; code: string } | null = null;
  const promoCode = str(b.promoCode).toUpperCase();
  if (promoCode) {
    const row = await prisma.discountCode.findUnique({ where: { code: promoCode } });
    const usable =
      row &&
      row.active &&
      (!row.expiresAt || row.expiresAt.getTime() >= Date.now()) &&
      (row.usageLimit == null || row.timesUsed < row.usageLimit);
    if (usable) {
      if (row.percentageOff != null) {
        discount = (subtotal * row.percentageOff) / 100;
      } else if (row.amountOff != null) {
        discount = Math.min(subtotal, Number(row.amountOff));
      }
      discount = round2(discount);
      appliedPromo = { id: row.id, code: row.code };
    }
  }

  const shipFee = shipping.fee;
  const total = round2(subtotal - discount + shipFee);
  const orderNumber = await uniqueOrderNumber();
  const paymentLabel = PAYMENT_LABEL[paymentKey];
  const shipToText = [`${firstName} ${lastName}`, line1, city, landmark && `Landmark: ${landmark}`]
    .filter(Boolean)
    .join(", ");

  // Snapshot the contact + shipping details into notes (Order has no address columns).
  const notes = JSON.stringify({
    contact: { firstName, lastName, email, phone },
    address: { line1, city, landmark: landmark || null },
    shipping: shipping.key,
    payment: paymentKey,
    promo: appliedPromo?.code ?? null,
  });

  // Card payments go through WiPay's hosted page. Request the hosted-page URL
  // BEFORE committing the order, so a gateway failure leaves nothing behind
  // (no order, no stock decrement) — the payor simply isn't redirected.
  let wipayRedirect: string | null = null;
  if (paymentKey === "card") {
    let config;
    try {
      config = getWipayConfig();
    } catch {
      return NextResponse.json(
        { error: "Card payments are temporarily unavailable. Please use Cash on Delivery." },
        { status: 503 },
      );
    }
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      new URL(request.url).origin;
    const wipay = await requestHostedPage({
      config,
      orderId: orderNumber,
      total: total.toFixed(2),
      responseUrl: `${baseUrl}/api/checkout/wipay/return`,
    });
    if (!wipay.ok) {
      return NextResponse.json({ error: wipay.error }, { status: wipay.status });
    }
    wipayRedirect = wipay.url;
  }

  let created: Order;
  try {
    created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        orderNumber,
        subtotal,
        shippingCost: shipFee,
        total,
        // Both COD and card start PENDING: COD is collected on arrival, and a
        // card order is only marked PAID once WiPay's verified callback returns.
        paymentStatus: "PENDING",
        fulfillmentStatus: "UNFULFILLED",
        paymentMethod: paymentLabel,
        notes,
        orderItems: {
          create: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
            price: round2(l.unitPrice),
          })),
        },
      },
    });

    // Atomic compare-and-decrement on the stock counter that gated the purchase
    // (variant if chosen, else product). The `inventory >= quantity` filter +
    // decrement is a single statement, so concurrent orders for the last unit
    // can't both succeed — `count === 0` means it sold out under us; roll back.
    for (const l of lines) {
      const res = l.variantId
        ? await tx.productVariant.updateMany({
            where: { id: l.variantId, inventory: { gte: l.quantity } },
            data: { inventory: { decrement: l.quantity } },
          })
        : await tx.product.updateMany({
            where: { id: l.productId, inventory: { gte: l.quantity } },
            data: { inventory: { decrement: l.quantity } },
          });
      if (res.count === 0) throw new OversoldError(l.name);
    }

    // Empty the cart.
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (appliedPromo) {
      await tx.discountCode.update({
        where: { id: appliedPromo.id },
        data: { timesUsed: { increment: 1 } },
      });
    }

    return order;
    });
  } catch (e) {
    if (e instanceof OversoldError) {
      return NextResponse.json(
        { error: `${e.itemName} just sold out — please adjust your bag.` },
        { status: 409 },
      );
    }
    throw e;
  }

  // Card path: hand the browser off to WiPay's secure hosted page. The order
  // stays PENDING; the confirmation email + Thank-You happen once the verified
  // callback marks it PAID (see /api/checkout/wipay/return).
  if (paymentKey === "card") {
    return NextResponse.json({ ok: true, redirect: wipayRedirect });
  }

  const responseOrder = {
    orderNumber: created.orderNumber,
    dateLabel: created.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    items: lines.map((l) => ({
      name: l.name,
      variant: l.variant,
      qty: l.quantity,
      price: round2(l.unitPrice),
      lineTotal: round2(l.unitPrice * l.quantity),
    })),
    subtotal,
    discount,
    shipFee,
    shipLabel: shipping.label,
    paymentLabel,
    total,
    eta: shipping.eta,
    contact: { firstName, lastName, email, phone },
    shipTo: shipToText,
  };

  // Best-effort confirmation email — never fail a placed order on email trouble.
  const emailResult = await sendOrderConfirmationEmail({
    to: email,
    name: `${firstName} ${lastName}`,
    order: {
      orderNumber: responseOrder.orderNumber,
      items: responseOrder.items.map((i) => ({
        name: i.name,
        variant: i.variant,
        qty: i.qty,
        price: i.price,
      })),
      subtotal,
      discount,
      shipLabel: shipping.label,
      shipFee,
      total,
      paymentLabel,
      eta: shipping.eta,
      shipTo: shipToText,
    },
  });
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[checkout] order ${created.orderNumber} placed; confirmation email → ${email}: ${emailResult.ok ? "sent" : `skipped (${emailResult.error})`}`,
    );
  }

  return NextResponse.json({ ok: true, order: responseOrder });
}
