import { describe, expect, it } from "vitest";
import {
  allowedReasons,
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

  // Since 2026-09-16 this only decides how a refusal is WORDED — merch is not
  // refused on hygiene grounds — not whether an item can be returned. Nothing
  // comes back for a change of mind either way.
  it("does not mark merch and accessories hygiene-final-sale", () => {
    expect(isFinalSale("merch")).toBe(false);
    expect(isFinalSale("accessories")).toBe(false);
  });

  it("treats an unrecognised category as final sale rather than promising a refund", () => {
    expect(isFinalSale("category-added-after-this-was-written")).toBe(true);
    expect(isFinalSale("")).toBe(true);
  });
});

describe("allowedReasons / isReasonAllowed", () => {
  // Regression guard for the owner's 2026-09-16 rule. If "Changed Mind" ever
  // comes back into RETURN_REASONS, the published policy starts contradicting
  // the form again — which is the exact class of bug open-issues P1 tracks.
  it("offers no change-of-mind reason", () => {
    expect(allowedReasons()).not.toContain("Changed Mind");
    expect(isReasonAllowed("Changed Mind")).toBe(false);
  });

  // Final sale never blocks a fault claim — that carve-out is what keeps the
  // policy lawful.
  it("keeps every fault reason available", () => {
    expect(allowedReasons()).toEqual([...RETURN_REASONS]);
    for (const r of ["Wrong Item Received", "Damaged Item", "Defective Item"]) {
      expect(isReasonAllowed(r)).toBe(true);
    }
  });

  it("rejects a reason that is not on the list at all", () => {
    expect(isReasonAllowed("Because I said so")).toBe(false);
    expect(isReasonAllowed("")).toBe(false);
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

  // Owner's rule, 2026-09-16. The form no longer offers change-of-mind, so the
  // published document must not offer one either — in particular it must not
  // still advertise the merch/accessories window it used to have.
  it("says plainly that change-of-mind returns are refused", () => {
    expect(text).toContain("change of mind");
    const eligible = RETURNS_POLICY_DOC.sections.find((s) => s.id === "eligible-returns");
    expect(JSON.stringify(eligible).toLowerCase()).toContain(
      "do not accept returns for a change of mind",
    );
  });

  it("no longer offers merchandise a change-of-mind window", () => {
    expect(text).not.toContain("unused, resalable condition");
    expect(text).not.toContain("keep a 14-day window");
  });
});

describe("RETURN_REASONS", () => {
  it("is the list the Returns Policy page publishes", () => {
    expect(RETURN_REASONS).toEqual([
      "Wrong Item Received",
      "Damaged Item",
      "Defective Item",
      "Other",
    ]);
  });

  it("offers no change-of-mind reason", () => {
    expect(RETURN_REASONS).not.toContain("Changed Mind");
  });
});
