import { describe, expect, it } from "vitest";
import { slugifyCategory } from "./options";

describe("slugifyCategory", () => {
  it("lowercases and hyphenates a normal name", () => {
    expect(slugifyCategory("Nipple Jewelry")).toBe("nipple-jewelry");
    expect(slugifyCategory("Belly Rings")).toBe("belly-rings");
  });

  it("collapses punctuation and runs of separators into one hyphen", () => {
    expect(slugifyCategory("Ear  &  Lobe")).toBe("ear-lobe");
    expect(slugifyCategory("14k Gold — Fine")).toBe("14k-gold-fine");
  });

  it("trims leading and trailing separators", () => {
    expect(slugifyCategory("  Septum  ")).toBe("septum");
    expect(slugifyCategory("--Merch--")).toBe("merch");
  });

  it("returns empty for a name with nothing sluggable, so the caller can reject it", () => {
    expect(slugifyCategory("")).toBe("");
    expect(slugifyCategory("   ")).toBe("");
    expect(slugifyCategory("!!!")).toBe("");
  });

  it("is idempotent — re-slugging an existing slug changes nothing", () => {
    for (const slug of ["belly-rings", "cartilage-jewelry", "merch"]) {
      expect(slugifyCategory(slug)).toBe(slug);
    }
  });
});

// The jewelry-type enum that used to live here is gone: Category is the single
// taxonomy now, and "does this show on the Jewelry page" is Category.isJewelry.
// Nothing to unit-test in that — it is a column, exercised by the queries.
