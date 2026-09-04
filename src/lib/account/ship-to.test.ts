import { describe, expect, it } from "vitest";
import { resolveShipTo, type ShipToSource } from "./ship-to";

const empty: ShipToSource = {
  shipName: null,
  shipPhone: null,
  shipEmail: null,
  shipLine1: null,
  shipCity: null,
  shipLandmark: null,
  notes: null,
};

describe("resolveShipTo", () => {
  it("prefers the snapshot columns", () => {
    expect(
      resolveShipTo({
        ...empty,
        shipName: "Aaliyah Mohammed",
        shipPhone: "8681234567",
        shipEmail: "a@example.com",
        shipLine1: "12 Rose Lane",
        shipCity: "Curepe",
        shipLandmark: "Opposite the bakery",
      }),
    ).toEqual({
      name: "Aaliyah Mohammed",
      phone: "8681234567",
      email: "a@example.com",
      line1: "12 Rose Lane",
      city: "Curepe",
      landmark: "Opposite the bakery",
    });
  });

  it("ignores notes entirely once a snapshot exists", () => {
    const result = resolveShipTo({
      ...empty,
      shipName: "New Snapshot",
      shipLine1: "1 Snapshot Street",
      notes: JSON.stringify({
        contact: { firstName: "Stale", lastName: "Notes" },
        address: { line1: "9 Old Road", city: "Arima" },
      }),
    });
    expect(result?.name).toBe("New Snapshot");
    expect(result?.line1).toBe("1 Snapshot Street");
  });

  it("falls back to the legacy notes JSON for pre-migration orders", () => {
    expect(
      resolveShipTo({
        ...empty,
        notes: JSON.stringify({
          contact: {
            firstName: "Renee",
            lastName: "Charles",
            phone: "8687654321",
            email: "r@example.com",
          },
          address: { line1: "45 Hibiscus Ave", city: "San Fernando", landmark: null },
          shipping: "courier",
        }),
      }),
    ).toEqual({
      name: "Renee Charles",
      phone: "8687654321",
      email: "r@example.com",
      line1: "45 Hibiscus Ave",
      city: "San Fernando",
      landmark: null,
    });
  });

  // Seeded orders put a lorem sentence in `notes`. Parsing must not throw, and
  // must not invent an address.
  it("returns null for notes that are not JSON", () => {
    expect(resolveShipTo({ ...empty, notes: "Customer asked for gift wrap." })).toBeNull();
  });

  it("returns null for JSON notes with no address line", () => {
    expect(
      resolveShipTo({ ...empty, notes: JSON.stringify({ shipping: "pickup" }) }),
    ).toBeNull();
    expect(
      resolveShipTo({ ...empty, notes: JSON.stringify({ address: { city: "Arima" } }) }),
    ).toBeNull();
  });

  // The whole point: "unknown" must be representable, because the alternative
  // is showing the customer's current address as a historical ship-to.
  it("returns null when there is nothing at all", () => {
    expect(resolveShipTo(empty)).toBeNull();
  });
});
