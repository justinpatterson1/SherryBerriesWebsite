import { describe, it, expect } from "vitest";
import {
  anonymizedEmail,
  anonymizedUserFields,
  checkDeletionAllowed,
  isAnonymizedEmail,
  scrubOrderNotes,
  scrubbedOrderShipping,
} from "./delete-account";

describe("anonymizedEmail", () => {
  it("is unique per user, because User.email is @unique", () => {
    expect(anonymizedEmail("abc")).not.toEqual(anonymizedEmail("def"));
  });

  it("uses a domain that can never resolve", () => {
    // RFC 2606 reserves .invalid. A deleted account must not be mailable.
    expect(anonymizedEmail("abc")).toMatch(/@deleted\.invalid$/);
  });

  it("round-trips through isAnonymizedEmail", () => {
    expect(isAnonymizedEmail(anonymizedEmail("abc"))).toBe(true);
    expect(isAnonymizedEmail("berry@sherryberries.com")).toBe(false);
  });
});

describe("anonymizedUserFields", () => {
  const now = new Date("2026-09-12T00:00:00.000Z");
  const fields = anonymizedUserFields("user_1", now);

  it("clears every personal column", () => {
    expect(fields.firstName).toBeNull();
    expect(fields.lastName).toBeNull();
    expect(fields.name).toBeNull();
    expect(fields.phoneNumber).toBeNull();
    expect(fields.image).toBeNull();
    expect(fields.avatarUrl).toBeNull();
  });

  it("leaves the row unable to authenticate", () => {
    // No password for the credentials provider to compare, and no verified
    // email — the two independent gates in auth.ts's authorize().
    expect(fields.password).toBeNull();
    expect(fields.emailVerified).toBeNull();
  });

  it("marks the deletion", () => {
    expect(fields.deletedAt).toBe(now);
  });
});

describe("scrubbedOrderShipping", () => {
  it("clears the identifying fields but keeps the city", () => {
    const s = scrubbedOrderShipping();
    expect(s.shipName).toBeNull();
    expect(s.shipPhone).toBeNull();
    expect(s.shipEmail).toBeNull();
    expect(s.shipLine1).toBeNull();
    expect(s.shipLandmark).toBeNull();
    // shipCity is deliberately absent from the update: a delivery dispute needs
    // to know where the goods went, and a city alone does not identify a person.
    expect(s).not.toHaveProperty("shipCity");
  });
});

describe("scrubOrderNotes", () => {
  // The exact shape api/checkout/route.ts writes.
  const checkoutNotes = JSON.stringify({
    contact: {
      firstName: "Sherry",
      lastName: "Nichols",
      email: "sherry@example.com",
      phone: "868-555-0100",
    },
    address: { line1: "12 Wilson Street", city: "Curepe", landmark: "by the church" },
    shipping: "standard",
    payment: "bank",
    promo: "BERRY10",
  });

  it("removes every contact field", () => {
    const out = JSON.parse(scrubOrderNotes(checkoutNotes)!);
    expect(out.contact).toEqual({
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
    });
  });

  it("removes the street and landmark but keeps the city", () => {
    const out = JSON.parse(scrubOrderNotes(checkoutNotes)!);
    expect(out.address).toEqual({ line1: null, city: "Curepe", landmark: null });
  });

  it("preserves the non-personal keys the account view still reads", () => {
    const out = JSON.parse(scrubOrderNotes(checkoutNotes)!);
    expect(out.shipping).toBe("standard");
    expect(out.payment).toBe("bank");
    expect(out.promo).toBe("BERRY10");
  });

  it("leaves output parseable — the account view falls back to notes", () => {
    expect(() => JSON.parse(scrubOrderNotes(checkoutNotes)!)).not.toThrow();
  });

  it("leaves a free-text admin note alone", () => {
    const note = "Customer asked us to leave it with the neighbour.";
    expect(scrubOrderNotes(note)).toBe(note);
  });

  it("leaves unparseable and empty values alone", () => {
    expect(scrubOrderNotes(null)).toBeNull();
    expect(scrubOrderNotes("")).toBe("");
    expect(scrubOrderNotes("{broken")).toBe("{broken");
  });

  it("leaves JSON that is not the checkout shape alone", () => {
    const other = JSON.stringify({ shipping: "express", payment: "card" });
    expect(scrubOrderNotes(other)).toBe(other);
  });

  it("does not choke on a JSON array", () => {
    expect(scrubOrderNotes("[1,2,3]")).toBe("[1,2,3]");
  });

  it("handles a partial payload with contact but no address", () => {
    const partial = JSON.stringify({ contact: { email: "a@b.com" }, payment: "cod" });
    const out = JSON.parse(scrubOrderNotes(partial)!);
    expect(out.contact.email).toBeNull();
    expect(out.payment).toBe("cod");
  });
});

describe("checkDeletionAllowed", () => {
  it("blocks the last superadmin", () => {
    const r = checkDeletionAllowed("SUPERADMIN", 0);
    expect(r.blocked).toBe(true);
  });

  it("allows a superadmin when another one remains", () => {
    expect(checkDeletionAllowed("SUPERADMIN", 1).blocked).toBe(false);
  });

  it("allows ordinary customers and admins", () => {
    expect(checkDeletionAllowed("CUSTOMER", 0).blocked).toBe(false);
    expect(checkDeletionAllowed("ADMIN", 0).blocked).toBe(false);
  });
});
