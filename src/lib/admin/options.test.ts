import { describe, expect, it } from "vitest";
import { JEWELRY_TYPE_VALUES, NON_JEWELRY_TYPE_VALUES, slugifyCategory } from "./options";

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

describe("NON_JEWELRY_TYPE_VALUES", () => {
  it("only lists real jewelry types", () => {
    for (const v of NON_JEWELRY_TYPE_VALUES) {
      expect(JEWELRY_TYPE_VALUES).toContain(v);
    }
  });

  // lib/queries/product.ts imports this list rather than restating it, so this
  // is the single definition of "not jewelry" for both the storefront and the
  // admin form's warning.
  it("is the aftercare/elixir pair the Jewelry listing hides", () => {
    expect(NON_JEWELRY_TYPE_VALUES).toEqual(["AFTERCARE", "ELIXIR"]);
  });
});
