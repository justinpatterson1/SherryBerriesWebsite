import { describe, it, expect } from "vitest";
import { SHIPPING, SHIPPING_ORDER, feeForCity, isShippingKey } from "./shipping";

describe("feeForCity", () => {
  it("prices courier from the city's rate card", () => {
    expect(feeForCity("courier", "Arima")).toBe(40);
    expect(feeForCity("courier", "Santa Cruz")).toBe(50);
    expect(feeForCity("courier", "Point Fortin")).toBe(60);
    expect(feeForCity("courier", "Tobago")).toBe(40);
  });

  it("refuses to price courier to a city that is not on the card", () => {
    // null is the signal for "we cannot price this" — the checkout API turns it
    // into a 400 rather than shipping at a fee nobody agreed to.
    expect(feeForCity("courier", "Scarborough")).toBeNull();
    expect(feeForCity("courier", "")).toBeNull();
  });

  it("ignores the city for pickup and TTPost", () => {
    expect(feeForCity("pickup", "Mayaro")).toBe(0);
    expect(feeForCity("pickup", "")).toBe(0);
    expect(feeForCity("ttpost", "Mayaro")).toBe(40);
    expect(feeForCity("ttpost", "not a real place")).toBe(40);
  });

  it("advertises the cheapest courier rate as the 'from' price", () => {
    expect(SHIPPING.courier.fee).toBe(40);
    expect(SHIPPING.courier.variesByCity).toBe(true);
    expect(SHIPPING.pickup.variesByCity).toBeUndefined();
    expect(SHIPPING.ttpost.variesByCity).toBeUndefined();
  });

  it("charges nothing for digital delivery, whatever the city", () => {
    expect(feeForCity("digital", "Arima")).toBe(0);
    expect(feeForCity("digital", "")).toBe(0);
  });
});

describe("the digital shipping key", () => {
  it("is free and labelled", () => {
    expect(SHIPPING.digital.fee).toBe(0);
    expect(SHIPPING.digital.label).toBeTruthy();
    expect(SHIPPING.digital.eta).toBeTruthy();
  });

  it("is not offered as a choice", () => {
    expect(SHIPPING_ORDER).toHaveLength(3);
    expect(SHIPPING_ORDER).not.toContain("digital");
  });

  // Regression guard: free-shipping bypass. If isShippingKey ever accepts
  // "digital", a cart full of jewelry can be checked out with a $0 delivery
  // fee just by putting that string in the request body.
  it("is rejected when it arrives from the client", () => {
    expect(isShippingKey("digital")).toBe(false);
    expect(isShippingKey("pickup")).toBe(true);
    expect(isShippingKey("ttpost")).toBe(true);
    expect(isShippingKey("courier")).toBe(true);
  });
});
