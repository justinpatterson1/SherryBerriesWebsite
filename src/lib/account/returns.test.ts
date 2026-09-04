import { describe, expect, it } from "vitest";
import {
  allowedReasonsFor,
  CHANGE_OF_MIND_REASON,
  isFinalSale,
  isReasonAllowed,
  RETURN_REASONS,
  RETURN_WINDOW_DAYS,
} from "./returns";
import { RETURNS_POLICY_DOC } from "@/lib/legal/returns-policy";

describe("isFinalSale", () => {
  it("marks every piercing-jewelry category final sale", () => {
    for (const slug of [
      "belly-rings",
      "nose-rings",
      "septum-jewelry",
      "cartilage-jewelry",
    ]) {
      expect(isFinalSale(slug)).toBe(true);
    }
  });

  it("marks aftercare and elixirs final sale — they are applied to a piercing", () => {
    expect(isFinalSale("aftercare")).toBe(true);
    expect(isFinalSale("elixirs")).toBe(true);
  });

  it("leaves merch and accessories returnable — no hygiene risk", () => {
    expect(isFinalSale("merch")).toBe(false);
    expect(isFinalSale("accessories")).toBe(false);
  });

  it("treats an unrecognised category as final sale rather than promising a refund", () => {
    expect(isFinalSale("category-added-after-this-was-written")).toBe(true);
    expect(isFinalSale("")).toBe(true);
  });
});

describe("allowedReasonsFor / isReasonAllowed", () => {
  it("drops change-of-mind on final-sale items", () => {
    const reasons = allowedReasonsFor("belly-rings");
    expect(reasons).not.toContain(CHANGE_OF_MIND_REASON);
    expect(isReasonAllowed("belly-rings", CHANGE_OF_MIND_REASON)).toBe(false);
    expect(isReasonAllowed("aftercare", CHANGE_OF_MIND_REASON)).toBe(false);
  });

  // The whole point of the carve-out: final sale never blocks a fault claim.
  it("keeps every fault reason available on final-sale items", () => {
    const reasons = allowedReasonsFor("belly-rings");
    expect(reasons).toEqual(["Wrong Item Received", "Damaged Item", "Defective Item", "Other"]);
    for (const r of ["Wrong Item Received", "Damaged Item", "Defective Item"]) {
      expect(isReasonAllowed("belly-rings", r)).toBe(true);
    }
  });

  it("offers every reason on returnable categories", () => {
    expect(allowedReasonsFor("merch")).toEqual([...RETURN_REASONS]);
    expect(isReasonAllowed("merch", CHANGE_OF_MIND_REASON)).toBe(true);
  });

  it("rejects a reason that is not on the list at all", () => {
    expect(isReasonAllowed("merch", "Because I said so")).toBe(false);
    expect(isReasonAllowed("belly-rings", "")).toBe(false);
  });

  it("treats an unknown category as final sale", () => {
    expect(allowedReasonsFor("brand-new-category")).not.toContain(CHANGE_OF_MIND_REASON);
  });
});

describe("RETURN_WINDOW_DAYS", () => {
  it("is the owner-confirmed 14 days", () => {
    expect(RETURN_WINDOW_DAYS).toBe(14);
  });

  // The cart trust strip, the product badge and the PDP accordion all state
  // this number. They read the constant, and so does the policy — this asserts
  // the published page really says the same thing, which is the claim that got
  // the site into trouble in the first place.
  it("is the window the published Returns Policy states", () => {
    const section = RETURNS_POLICY_DOC.sections.find((s) => s.id === "eligible-returns");
    expect(JSON.stringify(section)).toContain(`${RETURN_WINDOW_DAYS} days`);
  });
});

// Owner's rule, 2026-08-17. These two assertions are the ones that matter: the
// published policy must actually say jewelry is final sale, AND must keep the
// carve-out for our own mistakes — a blanket no-returns term would not survive
// the Sale of Goods Act.
describe("the published Returns Policy", () => {
  const text = JSON.stringify(RETURNS_POLICY_DOC).toLowerCase();

  it("states that jewelry and aftercare are final sale", () => {
    expect(text).toContain("final sale");
    const section = RETURNS_POLICY_DOC.sections.find((s) => s.id === "not-eligible");
    expect(JSON.stringify(section).toLowerCase()).toContain("final sale");
  });

  it("still promises to put right anything damaged, defective, or incorrect", () => {
    const section = RETURNS_POLICY_DOC.sections.find((s) => s.id === "damaged-or-incorrect");
    expect(section).toBeDefined();
    const damaged = JSON.stringify(section).toLowerCase();
    expect(damaged).toContain("replace");
    expect(damaged).toContain("refund");
    expect(damaged).toContain("final sale does not apply");
  });

  it("never claims returns are free for a change of mind", () => {
    expect(text).not.toContain("free returns");
  });
});

describe("RETURN_REASONS", () => {
  it("is the list the Returns Policy page publishes", () => {
    expect(RETURN_REASONS).toEqual([
      "Wrong Item Received",
      "Damaged Item",
      "Defective Item",
      "Changed Mind",
      "Other",
    ]);
  });
});
