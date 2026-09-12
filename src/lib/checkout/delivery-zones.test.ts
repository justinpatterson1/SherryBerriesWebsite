import { describe, it, expect } from "vitest";
import {
  CITIES_BY_REGION,
  DELIVERY_CITIES,
  DELIVERY_REGIONS,
  MIN_DELIVERY_FEE,
  deliveryFeeFor,
  findDeliveryCity,
  isDeliverableCity,
} from "./delivery-zones";

describe("the rate card itself", () => {
  it("carries every city on the owner's list, once each", () => {
    expect(DELIVERY_CITIES).toHaveLength(162);
    const names = DELIVERY_CITIES.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("groups the cities the way the rate card does", () => {
    const counts = DELIVERY_REGIONS.map((r) => CITIES_BY_REGION[r].length);
    expect(counts).toEqual([44, 30, 35, 52, 1]);
  });

  it("delivers to Tobago at the base rate, island-wide", () => {
    expect(CITIES_BY_REGION.Tobago).toEqual([
      { name: "Tobago", region: "Tobago", fee: 40 },
    ]);
  });

  it("prices every city at one of the three published bands", () => {
    const fees = new Set(DELIVERY_CITIES.map((c) => c.fee));
    expect([...fees].sort((a, b) => a - b)).toEqual([40, 50, 60]);
  });

  it("quotes $40 as the cheapest rate", () => {
    expect(MIN_DELIVERY_FEE).toBe(40);
  });
});

describe("deliveryFeeFor", () => {
  it("prices a city from each band", () => {
    expect(deliveryFeeFor("Arima")).toBe(40);
    expect(deliveryFeeFor("Sangre Grande")).toBe(50);
    expect(deliveryFeeFor("Mayaro")).toBe(60);
  });

  it("prices the two cities that share a name shape with another region", () => {
    // Oropouche is South at $50; South Oropouche is a separate $60 entry.
    expect(deliveryFeeFor("Oropouche")).toBe(50);
    expect(deliveryFeeFor("South Oropouche")).toBe(60);
  });

  it("prices Tobago", () => {
    expect(deliveryFeeFor("Tobago")).toBe(40);
  });

  it("returns null for a city we do not deliver to", () => {
    // Scarborough is in Tobago but is not itself an entry — the island is one
    // island-wide option, so the town name alone must not resolve to a price.
    expect(deliveryFeeFor("Scarborough")).toBeNull();
    expect(deliveryFeeFor("")).toBeNull();
  });
});

describe("matching a saved address", () => {
  it("ignores case and stray whitespace", () => {
    expect(findDeliveryCity("  chaguanas ")?.name).toBe("Chaguanas");
    expect(findDeliveryCity("PORT OF SPAIN")?.name).toBe("Port of Spain");
    expect(findDeliveryCity("Port  of  Spain")?.name).toBe("Port of Spain");
  });

  it("keeps apostrophes and punctuation significant", () => {
    expect(findDeliveryCity("O'Meara")?.fee).toBe(40);
    expect(findDeliveryCity("OMeara")).toBeNull();
    expect(findDeliveryCity("Pointe-a-Pierre")?.fee).toBe(50);
  });

  it("does not guess at a near-miss", () => {
    expect(isDeliverableCity("Arima Old")).toBe(false);
    expect(isDeliverableCity("San Fernando South")).toBe(false);
  });
});
