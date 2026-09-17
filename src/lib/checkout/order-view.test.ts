import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildPlacedOrder, type OrderForView } from "./order-view";

function order(notes: Record<string, unknown>, over: Partial<OrderForView> = {}): OrderForView {
  return {
    orderNumber: "SB-10480001",
    createdAt: new Date("2026-09-16T12:00:00Z"),
    subtotal: 100,
    shippingCost: 0,
    total: 100,
    paymentMethod: "Credit Card (WiPay)",
    notes: JSON.stringify(notes),
    orderItems: [
      {
        quantity: 1,
        price: 100,
        product: { name: "Aftercare Manual", material: null },
        variant: null,
      },
    ],
    ...over,
  };
}

const contact = { firstName: "Ama", lastName: "Joseph", email: "ama@example.com", phone: "8681234567" };

describe("buildPlacedOrder", () => {
  it("presents a digital order as delivered to the buyer's inbox, with no fee", () => {
    const placed = buildPlacedOrder(
      order({ contact, address: null, shipping: "digital", payment: "card" }),
    );
    expect(placed.digital).toBe(true);
    expect(placed.shipLabel).toBe("Digital delivery");
    expect(placed.shipFee).toBe(0);
    expect(placed.shipTo).toBe("ama@example.com");
    expect(placed.eta).toMatch(/download/i);
  });

  it("still builds a shipped order the way it always did", () => {
    const placed = buildPlacedOrder(
      order(
        {
          contact,
          address: { line1: "12 Rose Lane", city: "Arima", landmark: "by the church" },
          shipping: "courier",
          payment: "cod",
        },
        { shippingCost: 40, total: 140 },
      ),
    );
    expect(placed.digital).toBe(false);
    expect(placed.shipLabel).toBe("Courier Delivery");
    expect(placed.shipFee).toBe(40);
    expect(placed.shipTo).toBe("Ama Joseph, 12 Rose Lane, Arima, Landmark: by the church");
  });

  // Pins the existing fallback: an unknown key must not become "digital" and
  // silently drop the shipping line off an order that does ship.
  it("falls back to pickup for a missing or unrecognised shipping key", () => {
    expect(buildPlacedOrder(order({ contact, payment: "card" })).shipLabel).toBe("Pickup (Curepe)");
    expect(
      buildPlacedOrder(order({ contact, shipping: "teleport", payment: "card" })).digital,
    ).toBe(false);
  });

  it("recovers the discount from the totals", () => {
    const placed = buildPlacedOrder(
      order({ contact, shipping: "digital", payment: "card" }, { total: 90 }),
    );
    expect(placed.discount).toBe(10);
  });
});
