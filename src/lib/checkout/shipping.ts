// Single source of truth for the Trinidad & Tobago checkout's shipping methods
// and payment labels — imported by both the checkout API (authoritative totals)
// and the client UI so fees/labels/ETAs never drift apart.

export type ShippingKey = "pickup" | "ttpost" | "courier";
export type PaymentKey = "cod" | "card";

export type ShippingOption = {
  key: ShippingKey;
  label: string;
  sub: string;
  fee: number;
  eta: string;
};

export const SHIPPING: Record<ShippingKey, ShippingOption> = {
  pickup: {
    key: "pickup",
    label: "Pickup (Curepe)",
    sub: "Collect in-store · ready in 24h",
    fee: 0,
    eta: "Ready for pickup within 24 hours",
  },
  ttpost: {
    key: "ttpost",
    label: "TTPost",
    sub: "3–5 business days nationwide",
    fee: 25,
    eta: "Arrives in 3–5 business days",
  },
  courier: {
    key: "courier",
    label: "Courier Delivery",
    sub: "1–2 business days · tracked",
    fee: 40,
    eta: "Arrives in 1–2 business days",
  },
};

export const SHIPPING_ORDER: ShippingKey[] = ["pickup", "ttpost", "courier"];

export const PAYMENT_LABEL: Record<PaymentKey, string> = {
  cod: "Cash on Delivery",
  card: "Credit Card (WiPay)",
};

export function isShippingKey(v: unknown): v is ShippingKey {
  return v === "pickup" || v === "ttpost" || v === "courier";
}

export function isPaymentKey(v: unknown): v is PaymentKey {
  return v === "cod" || v === "card";
}
