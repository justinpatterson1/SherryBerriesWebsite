import { describe, expect, it } from "vitest";
import { slugifyCategory, validateDigitalProduct } from "./options";

const base = { isDigital: true, digitalFileKey: "digital/abc-123.pdf", sizeCount: 0, stock: 7, reorder: 5 };

describe("validateDigitalProduct", () => {
  it("leaves a physical product's stock alone", () => {
    const out = validateDigitalProduct({ ...base, isDigital: false });
    expect(out).toEqual({ ok: true, digitalFileKey: null, stock: 7, reorder: 5 });
  });

  it("pins a digital product to no stock and no reorder point", () => {
    expect(validateDigitalProduct(base)).toEqual({
      ok: true,
      digitalFileKey: "digital/abc-123.pdf",
      stock: 0,
      reorder: 0,
    });
  });

  it("refuses a digital product with sizes", () => {
    const out = validateDigitalProduct({ ...base, sizeCount: 2 });
    expect(out.ok).toBe(false);
  });

  it("refuses a digital product with no file", () => {
    expect(validateDigitalProduct({ ...base, digitalFileKey: "" }).ok).toBe(false);
    expect(validateDigitalProduct({ ...base, digitalFileKey: "   " }).ok).toBe(false);
  });

  // Regression guard: receipt exfiltration. The key is a plain string from the
  // admin's browser, and the download route serves whatever it names.
  it("refuses a key pointing anywhere but the digital prefix", () => {
    for (const key of [
      "payments/SB-1048/secret.pdf",
      "digital/../payments/SB-1048/secret.pdf",
      "products/photo.png",
      "digital/thing.exe",
      "https://cdn.example.com/digital/a.pdf",
    ]) {
      expect(validateDigitalProduct({ ...base, digitalFileKey: key }).ok).toBe(false);
    }
  });

  it("discards a stray key on a product that is not digital", () => {
    const out = validateDigitalProduct({ ...base, isDigital: false });
    expect(out.ok && out.digitalFileKey).toBeNull();
  });
});

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
