import { describe, it, expect } from "vitest";
import { SHIPPING, feeForCity } from "./shipping";

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
});
