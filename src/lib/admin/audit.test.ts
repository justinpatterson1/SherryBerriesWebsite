import { describe, expect, it } from "vitest";
import { AUDIT_ACTIONS, auditIp, diffFields, hasChanges } from "./audit-changes";

// A fake Prisma Decimal: the real one is an object exposing toNumber(), which
// is why diffFields normalises before comparing.
const decimal = (n: number) => ({ toNumber: () => n });

describe("diffFields", () => {
  it("reports only the fields that actually moved", () => {
    const changes = diffFields(
      { name: "Halo Hoop", inventory: 12, featured: false },
      { name: "Halo Hoop", inventory: 8, featured: false },
      ["name", "inventory", "featured"],
    );
    expect(changes).toEqual({ inventory: { from: 12, to: 8 } });
  });

  // The bug this prevents: Prisma returns price as a Decimal object, the route
  // parses it as a number. Compared raw, every save would look like it changed
  // the price and the log would be useless noise.
  it("does not treat a Decimal and an equal number as a change", () => {
    const changes = diffFields({ price: decimal(45) }, { price: 45 }, ["price"]);
    expect(hasChanges(changes)).toBe(false);
  });

  it("records a real price move with plain numbers on both sides", () => {
    const changes = diffFields({ price: decimal(45) }, { price: 39 }, ["price"]);
    expect(changes).toEqual({ price: { from: 45, to: 39 } });
  });

  it("treats null and undefined as the same absent value", () => {
    expect(hasChanges(diffFields({ material: null }, { material: undefined }, ["material"])))
      .toBe(false);
  });

  it("records going from a value to null, which is how a field gets cleared", () => {
    expect(diffFields({ material: "titanium" }, { material: null }, ["material"])).toEqual({
      material: { from: "titanium", to: null },
    });
  });

  // A route sends only the fields it is updating; absent means "not touched",
  // which must not read as "cleared".
  it("ignores fields the caller did not send", () => {
    expect(hasChanges(diffFields({ name: "A", sku: "X1" }, { name: "A" }, ["name", "sku"])))
      .toBe(false);
  });

  it("normalises Dates so equal timestamps do not register", () => {
    const when = new Date("2026-09-05T12:00:00Z");
    expect(hasChanges(diffFields({ at: when }, { at: new Date(when) }, ["at"]))).toBe(false);
  });
});

describe("auditIp", () => {
  it("takes the first hop of x-forwarded-for", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(auditIp(req)).toBe("203.0.113.5");
  });

  // Unlike the rate limiter, an unknown IP is null rather than a loopback
  // placeholder — recording "127.0.0.1" in an audit trail would be a lie.
  it("is null when no proxy header is present", () => {
    expect(auditIp(new Request("https://x.test"))).toBeNull();
  });
});

describe("AUDIT_ACTIONS", () => {
  it("uses dotted entity.verb names, which the Activity filters rely on", () => {
    for (const action of Object.values(AUDIT_ACTIONS)) {
      expect(action).toMatch(/^[a-z]+\.[a-z_]+$/);
    }
  });
});
