import { describe, expect, it } from "vitest";
import { isHygieneExcluded, RETURN_REASONS } from "./returns";

describe("isHygieneExcluded", () => {
  it("excludes every piercing-jewelry category", () => {
    for (const slug of [
      "belly-rings",
      "nose-rings",
      "septum-jewelry",
      "cartilage-jewelry",
    ]) {
      expect(isHygieneExcluded(slug)).toBe(true);
    }
  });

  it("excludes aftercare and elixirs, which are applied to a piercing", () => {
    expect(isHygieneExcluded("aftercare")).toBe(true);
    expect(isHygieneExcluded("elixirs")).toBe(true);
  });

  it("allows merch and accessories, which the policy calls resalable", () => {
    expect(isHygieneExcluded("merch")).toBe(false);
    expect(isHygieneExcluded("accessories")).toBe(false);
  });

  it("excludes an unrecognised category rather than promising a refund", () => {
    expect(isHygieneExcluded("category-added-after-this-was-written")).toBe(true);
    expect(isHygieneExcluded("")).toBe(true);
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
