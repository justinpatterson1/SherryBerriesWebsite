// How an order reaches the customer, for the admin Orders table.
//
// The checkout does not store the shipping method in a column — it snapshots it
// into the JSON blob in `Order.notes`. This reads it back out, pure and without
// I/O so it can be unit-tested.

import { isStoredShippingKey, type ShippingKey } from "@/lib/checkout/shipping";

export type DeliveryMethod = {
  key: ShippingKey | "unknown";
  /** Short label for a table cell, not the checkout's longer marketing copy. */
  label: string;
};

const LABELS: Record<ShippingKey, string> = {
  pickup: "Pickup",
  ttpost: "TTPost",
  courier: "Courier",
  digital: "Digital",
};

/**
 * Reads the method out of an order's notes blob.
 *
 * Returns "unknown" rather than guessing "Pickup" for seeded and legacy orders
 * whose notes hold a plain sentence: the admin needs to see that the shop has
 * no record of how the parcel goes out, not a default that looks like a fact.
 */
export function deliveryFor(notes: string | null): DeliveryMethod {
  if (!notes) return { key: "unknown", label: "Not recorded" };
  try {
    const parsed = JSON.parse(notes) as { shipping?: unknown };
    if (isStoredShippingKey(parsed?.shipping)) {
      return { key: parsed.shipping, label: LABELS[parsed.shipping] };
    }
  } catch {
    // Not JSON — a seeded order's free-text note.
  }
  return { key: "unknown", label: "Not recorded" };
}
