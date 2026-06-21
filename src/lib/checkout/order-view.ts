// Rebuilds the presentational `PlacedOrder` (the Thank-You + confirmation-email
// shape) from a persisted Order + its items. The checkout API snapshots the
// contact/shipping/promo details into `Order.notes`; this reverses that so the
// WiPay return handler (email) and the confirmation page (Thank-You) share one
// derivation instead of duplicating it.

import {
  PAYMENT_LABEL,
  SHIPPING,
  isPaymentKey,
  isShippingKey,
  type PaymentKey,
} from "./shipping";
import type { PlacedOrder } from "@/components/checkout/thank-you";

type DecimalLike = { toString(): string } | number;

export type OrderForView = {
  orderNumber: string;
  createdAt: Date;
  subtotal: DecimalLike;
  shippingCost: DecimalLike;
  total: DecimalLike;
  paymentMethod: string | null;
  notes: string | null;
  orderItems: {
    quantity: number;
    price: DecimalLike;
    product: { name: string; material: string | null };
    variant: { value: string | null } | null;
  }[];
};

type OrderNotes = {
  contact?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  address?: { line1?: string; city?: string; landmark?: string | null };
  shipping?: string;
  payment?: string;
  promo?: string | null;
};

const num = (v: DecimalLike) => Number(typeof v === "number" ? v : v.toString());
const round2 = (n: number) => Number(n.toFixed(2));

function parseNotes(raw: string | null): OrderNotes {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as OrderNotes;
  } catch {
    return {};
  }
}

export function buildPlacedOrder(order: OrderForView): PlacedOrder {
  const notes = parseNotes(order.notes);
  const ship = SHIPPING[isShippingKey(notes.shipping) ? notes.shipping : "pickup"];
  const paymentKey: PaymentKey = isPaymentKey(notes.payment) ? notes.payment : "card";

  const subtotal = round2(num(order.subtotal));
  const shipFee = round2(num(order.shippingCost));
  const total = round2(num(order.total));
  // Discount isn't a stored column — it's the gap left after shipping.
  const discount = round2(Math.max(0, subtotal + shipFee - total));

  const items = order.orderItems.map((it) => {
    const price = round2(num(it.price));
    const variant =
      [it.product.material, it.variant?.value].filter(Boolean).join(" · ") || null;
    return {
      name: it.product.name,
      variant,
      qty: it.quantity,
      price,
      lineTotal: round2(price * it.quantity),
    };
  });

  const c = notes.contact ?? {};
  const firstName = c.firstName ?? "";
  const lastName = c.lastName ?? "";
  const a = notes.address ?? {};
  const shipTo = [
    `${firstName} ${lastName}`.trim(),
    a.line1,
    a.city,
    a.landmark ? `Landmark: ${a.landmark}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    orderNumber: order.orderNumber,
    dateLabel: order.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    items,
    subtotal,
    discount,
    shipFee,
    shipLabel: ship.label,
    paymentLabel: order.paymentMethod ?? PAYMENT_LABEL[paymentKey],
    total,
    eta: ship.eta,
    contact: { firstName, lastName, email: c.email ?? "", phone: c.phone ?? "" },
    shipTo,
  };
}
