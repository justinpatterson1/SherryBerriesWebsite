import { describe, expect, it } from "vitest";
import { COLORS_MAX, colorsSummary, validateColors } from "./colors";

const IMG = "https://cdn.example.com/gold.webp";

describe("validateColors", () => {
  it("accepts no colours", () => {
    expect(validateColors([])).toEqual({ ok: true, colors: [] });
    expect(validateColors(undefined)).toEqual({ ok: true, colors: [] });
  });

  it("trims and normalises a colour", () => {
    const r = validateColors([
      { id: "c1", name: "  Gold ", swatch: "#C9A96E", imageUrl: ` ${IMG} `, additionalPrice: 2.505 },
    ]);
    expect(r).toEqual({
      ok: true,
      colors: [{ id: "c1", name: "Gold", swatch: "#c9a96e", imageUrl: IMG, additionalPrice: 2.5 }],
    });
  });

  it("treats a blank swatch and extra price as none", () => {
    const r = validateColors([{ name: "Gold", swatch: "", imageUrl: IMG, additionalPrice: "" }]);
    if (r.ok) expect(r.colors[0]).toMatchObject({ id: null, swatch: null, additionalPrice: null });
  });

  it("drops a row with no name", () => {
    const r = validateColors([{ name: "Gold", imageUrl: IMG }, { name: "  ", imageUrl: "" }]);
    if (r.ok) expect(r.colors).toHaveLength(1);
  });

  it("rejects the same colour twice, case-insensitively", () => {
    const r = validateColors([
      { name: "Gold", imageUrl: IMG },
      { name: "gold", imageUrl: IMG },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("listed twice");
  });

  it("requires a photo, given as a web address", () => {
    expect(validateColors([{ name: "Gold" }]).ok).toBe(false);
    expect(validateColors([{ name: "Gold", imageUrl: "javascript:alert(1)" }]).ok).toBe(false);
  });

  it("rejects a swatch that is not a six-digit hex colour", () => {
    expect(validateColors([{ name: "Gold", swatch: "gold", imageUrl: IMG }]).ok).toBe(false);
    expect(validateColors([{ name: "Gold", swatch: "#fff", imageUrl: IMG }]).ok).toBe(false);
  });

  it("rejects a negative or non-numeric extra price", () => {
    expect(validateColors([{ name: "Gold", imageUrl: IMG, additionalPrice: -1 }]).ok).toBe(false);
    expect(validateColors([{ name: "Gold", imageUrl: IMG, additionalPrice: "2" }]).ok).toBe(false);
  });

  it("rejects more rows than the cap, a non-array, and an over-long name", () => {
    const many = Array.from({ length: COLORS_MAX + 1 }, (_, i) => ({ name: `C${i}`, imageUrl: IMG }));
    expect(validateColors(many).ok).toBe(false);
    expect(validateColors("Gold").ok).toBe(false);
    expect(validateColors([{ name: "x".repeat(25), imageUrl: IMG }]).ok).toBe(false);
  });
});

describe("colorsSummary", () => {
  const gold = { name: "Gold", swatch: "#c9a96e", imageUrl: "https://cdn.example.com/p/gold.webp", additionalPrice: 10 };

  it("lists each colour with its swatch, photo file name and extra price", () => {
    expect(
      colorsSummary([gold, { name: "Silver", swatch: null, imageUrl: IMG, additionalPrice: null }]),
    ).toBe("Gold (#c9a96e, gold.webp, +$10.00); Silver (gold.webp)");
  });

  it("says so when there are none", () => {
    expect(colorsSummary([])).toBe("no colours");
  });

  it("changes when only the photo, swatch or extra price changes", () => {
    const base = colorsSummary([gold]);
    expect(colorsSummary([{ ...gold, imageUrl: "https://cdn.example.com/p/gold-2.webp" }])).not.toBe(base);
    expect(colorsSummary([{ ...gold, swatch: "#d4af37" }])).not.toBe(base);
    expect(colorsSummary([{ ...gold, additionalPrice: 12 }])).not.toBe(base);
  });
});
