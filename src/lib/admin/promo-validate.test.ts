import { describe, expect, it } from "vitest";
import {
  normalisePromoCode,
  promoLabel,
  promoState,
  validatePromo,
} from "./promo-validate";

const base = { code: "BERRY10", percentageOff: 10, amountOff: null, expiresAt: "" };

describe("normalisePromoCode", () => {
  it("uppercases and strips spaces, matching how checkout looks codes up", () => {
    expect(normalisePromoCode("  berry 10 ")).toBe("BERRY10");
  });
});

describe("validatePromo", () => {
  it("accepts a straightforward percentage code", () => {
    const res = validatePromo(base);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toMatchObject({ code: "BERRY10", percentageOff: 10 });
  });

  // The checkout applies percentage OR amount and never both, so a code with
  // both set would have an ambiguous value at the till.
  it("refuses a code with both a percentage and an amount", () => {
    const res = validatePromo({ ...base, amountOff: 5 });
    expect(res).toMatchObject({ ok: false });
  });

  it("refuses a code with neither", () => {
    expect(validatePromo({ ...base, percentageOff: null })).toMatchObject({ ok: false });
  });

  it("holds percentages to 1–100", () => {
    expect(validatePromo({ ...base, percentageOff: 0 })).toMatchObject({ ok: false });
    expect(validatePromo({ ...base, percentageOff: 101 })).toMatchObject({ ok: false });
    expect(validatePromo({ ...base, percentageOff: 100 }).ok).toBe(true);
  });

  it("requires an amount above zero and rounds to cents", () => {
    expect(validatePromo({ ...base, percentageOff: null, amountOff: 0 })).toMatchObject({
      ok: false,
    });
    const res = validatePromo({ ...base, percentageOff: null, amountOff: 12.345 });
    expect(res.ok && res.data.amountOff).toBe(12.35);
  });

  it("rejects codes with spaces or symbols once normalised", () => {
    expect(validatePromo({ ...base, code: "BERRY-10" })).toMatchObject({ ok: false });
    expect(validatePromo({ ...base, code: "AB" })).toMatchObject({ ok: false });
  });

  it("treats blank optional fields as not set rather than as zero", () => {
    const res = validatePromo({ ...base, usageLimit: "", expiresAt: "" });
    expect(res.ok && res.data.usageLimit).toBeNull();
  });

  it("requires a usage limit of at least 1 when one is given", () => {
    expect(validatePromo({ ...base, usageLimit: 0 })).toMatchObject({ ok: false });
    expect(validatePromo({ ...base, usageLimit: 2.5 })).toMatchObject({ ok: false });
  });

  it("rejects an unparseable expiry", () => {
    expect(validatePromo({ ...base, expiresAt: "next tuesday" })).toMatchObject({ ok: false });
  });
});

describe("promoLabel", () => {
  it("describes both kinds of discount", () => {
    expect(promoLabel(20, null)).toBe("20% off");
    expect(promoLabel(null, 50)).toBe("$50.00 off");
  });
});

// This mirrors the usability test in /api/checkout. If they disagree, the admin
// screen shows "Active" for a code the checkout refuses — the exact confusion
// this function exists to prevent.
describe("promoState", () => {
  const ok = { active: true, expiresAt: null, usageLimit: null, timesUsed: 0 };

  it("is Active when nothing disqualifies it", () => {
    expect(promoState(ok)).toBe("Active");
  });

  it("reports Inactive ahead of any other reason", () => {
    expect(promoState({ ...ok, active: false })).toBe("Inactive");
  });

  it("reports Expired once the date has passed", () => {
    expect(promoState({ ...ok, expiresAt: new Date(Date.now() - 86_400_000) })).toBe("Expired");
    expect(promoState({ ...ok, expiresAt: new Date(Date.now() + 86_400_000) })).toBe("Active");
  });

  it("reports Used up at the limit, not one past it", () => {
    expect(promoState({ ...ok, usageLimit: 5, timesUsed: 5 })).toBe("Used up");
    expect(promoState({ ...ok, usageLimit: 5, timesUsed: 4 })).toBe("Active");
  });
});
