// Single source of truth for the Trinidad & Tobago checkout's shipping methods
// and payment labels — imported by both the checkout API (authoritative totals)
// and the client UI so fees/labels/ETAs never drift apart.

import { deliveryFeeFor, MIN_DELIVERY_FEE } from "./delivery-zones";

export type ShippingKey = "pickup" | "ttpost" | "courier";
export type PaymentKey = "cod" | "card" | "bank";

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
};

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

export function isShippingKey(v: unknown): v is ShippingKey {
  return v === "pickup" || v === "ttpost" || v === "courier";
}

export function isPaymentKey(v: unknown): v is PaymentKey {
  return v === "cod" || v === "card" || v === "bank";
}
