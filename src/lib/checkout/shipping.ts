// Single source of truth for the Trinidad & Tobago checkout's shipping methods
// and payment labels — imported by both the checkout API (authoritative totals)
// and the client UI so fees/labels/ETAs never drift apart.

import { deliveryFeeFor, MIN_DELIVERY_FEE } from "./delivery-zones";

export type ShippingKey = "pickup" | "ttpost" | "courier" | "digital";
export type PaymentKey = "cod" | "card" | "bank";

/**
 * Assigned by the server to an order with nothing to ship. Never selectable:
 * it is absent from SHIPPING_ORDER (so no radio renders) and rejected by
 * isShippingKey (so it cannot arrive in a request body).
 */
export const DIGITAL_SHIPPING_KEY: ShippingKey = "digital";

export type ShippingOption = {
  key: ShippingKey;
  label: string;
  sub: string;
  /**
   * Pickup and TTPost charge this flat. Courier varies by city, so for courier
   * this is only the "from" price used before a city is chosen — the amount
   * actually charged comes from feeForCity().
   */
  fee: number;
  eta: string;
  /** True when `fee` is a starting price rather than the real one. */
  variesByCity?: boolean;
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
    fee: 40,
    eta: "Arrives in 3–5 business days",
  },
  courier: {
    key: "courier",
    label: "Courier Delivery",
    sub: "1–2 business days · tracked · rate by area",
    fee: MIN_DELIVERY_FEE,
    eta: "Arrives in 1–2 business days",
    variesByCity: true,
  },
  digital: {
    key: "digital",
    label: "Digital delivery",
    sub: "Download from your order page",
    fee: 0,
    eta: "Available to download as soon as your payment is confirmed",
  },
};

/**
 * The methods the customer picks between. "digital" is deliberately absent —
 * it is not a choice, it is what an order with nothing to ship gets.
 */
export const SHIPPING_ORDER: ShippingKey[] = ["pickup", "ttpost", "courier"];

export const PAYMENT_LABEL: Record<PaymentKey, string> = {
  cod: "Cash on Delivery",
  card: "Credit Card (WiPay)",
  bank: "Bank Transfer",
};

/**
 * The fee actually charged for a method, given the delivery city.
 *
 * Returns `null` only for courier to a city that is not on the rate card — the
 * caller must treat that as "we cannot price this order" and refuse it rather
 * than fall back to a guess. Pickup and TTPost ignore the city entirely.
 */
export function feeForCity(key: ShippingKey, city: string): number | null {
  if (key !== "courier") return SHIPPING[key].fee;
  return deliveryFeeFor(city);
}

/**
 * Guard for a CLIENT-SUPPLIED shipping key.
 *
 * "digital" is excluded on purpose and must stay excluded: it carries a $0 fee,
 * so accepting it here would let anyone check out a cart full of jewelry with
 * `shipping: "digital"` and pay no delivery charge. The server assigns that key
 * itself, from the cart's contents — see DIGITAL_SHIPPING_KEY.
 */
export function isShippingKey(v: unknown): v is ShippingKey {
  return v === "pickup" || v === "ttpost" || v === "courier";
}

/**
 * Guard for a key read back out of storage, where "digital" is legitimate.
 *
 * Kept separate from isShippingKey so the narrower client guard can never be
 * widened by accident: this one is for `Order.notes`, which the server wrote.
 */
export function isStoredShippingKey(v: unknown): v is ShippingKey {
  return isShippingKey(v) || v === DIGITAL_SHIPPING_KEY;
}

export function isPaymentKey(v: unknown): v is PaymentKey {
  return v === "cod" || v === "card" || v === "bank";
}

/**
 * Whether a payment method can be used with a shipping method.
 *
 * Cash on Delivery needs a person to hand the money to. TTPost posts the parcel
 * — nobody from the shop is there when it arrives, so there is no one to
 * collect. Pickup keeps COD (pay over the counter), and so does a download
 * (pay us directly, the file unlocks once it clears).
 *
 * Used by the checkout form to grey the option out and by /api/checkout to
 * refuse the combination outright, so the rule holds whatever the browser
 * sends.
 */
export function isPaymentAllowedFor(payment: PaymentKey, shipping: ShippingKey): boolean {
  return !(payment === "cod" && shipping === "ttpost");
}

/** Why a payment method is unavailable, shown on the greyed-out option. */
export function paymentUnavailableReason(
  payment: PaymentKey,
  shipping: ShippingKey,
): string | null {
  if (isPaymentAllowedFor(payment, shipping)) return null;
  return "Not available with TTPost — nobody is there to collect the cash";
}
