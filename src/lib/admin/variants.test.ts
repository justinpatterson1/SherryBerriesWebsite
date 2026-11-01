import { describe, expect, it } from "vitest";
import type { SizeRow } from "./sizes";
import {
  matchVariants,
  stockFromVariants,
  validateVariants,
  variantLabel,
  variantSku,
  variantsSummary,
  type ExistingVariant,
} from "./variants";

const IMG = "https://cdn.example.com/c.webp";

describe("variantLabel", () => {
  it("joins colour and size, or shows whichever exists", () => {
    expect(variantLabel("Gold", "8mm")).toBe("Gold · 8mm");
    expect(variantLabel("Gold", null)).toBe("Gold");
    expect(variantLabel(null, "8mm")).toBe("8mm");
  });
});

describe("validateVariants", () => {
  it("has no lines without sizes or colours", () => {
    const r = validateVariants({ sizeLabel: "", sizes: [], colors: [], stock: [] });
    expect(r).toEqual({ ok: true, label: null, sizes: [], colors: [], variants: [] });
  });

  it("gives a sizes-only product one line per size", () => {
    const r = validateVariants({
      sizeLabel: "Length",
      sizes: [{ value: "6mm" }, { value: "8mm", additionalPrice: 5 }],
      colors: [],
      stock: [
        { color: null, size: "6mm", quantity: 4 },
        { color: null, size: "8mm", quantity: 2 },
      ],
    });
    expect(r.ok && r.variants).toEqual([
      { colorIndex: null, size: "6mm", value: "6mm", quantity: 4, additionalPrice: null },
      { colorIndex: null, size: "8mm", value: "8mm", quantity: 2, additionalPrice: 5 },
    ]);
  });

  it("gives a colours-only product one line per colour", () => {
    const r = validateVariants({
      sizeLabel: "",
      sizes: [],
      colors: [{ name: "Gold", imageUrl: IMG, additionalPrice: 10 }],
      stock: [{ color: "Gold", size: null, quantity: 3 }],
    });
    expect(r.ok && r.label).toBeNull();
    expect(r.ok && r.variants).toEqual([
      { colorIndex: 0, size: null, value: "Gold", quantity: 3, additionalPrice: 10 },
    ]);
  });

  it("crosses colours with sizes, adding the two extra prices", () => {
    const r = validateVariants({
      sizeLabel: "Length",
      sizes: [{ value: "6mm" }, { value: "8mm", additionalPrice: 5 }],
      colors: [
        { name: "Silver", imageUrl: IMG },
        { name: "Gold", imageUrl: IMG, additionalPrice: 10.25 },
      ],
      stock: [{ color: "gold", size: "8MM", quantity: 7 }],
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.variants.map((v) => [v.value, v.quantity, v.additionalPrice])).toEqual([
      ["Silver · 6mm", 0, null],
      ["Silver · 8mm", 0, 5],
      ["Gold · 6mm", 0, 10.25],
      ["Gold · 8mm", 7, 15.25],
    ]);
  });

  it("ignores stock for a combination that no longer exists", () => {
    const r = validateVariants({
      sizeLabel: "L",
      sizes: [{ value: "8mm" }],
      colors: [],
      stock: [{ color: null, size: "10mm", quantity: -5 }],
    });
    expect(r.ok && r.variants[0].quantity).toBe(0);
  });

  it("rejects a bad quantity, naming the combination", () => {
    const r = validateVariants({
      sizeLabel: "L",
      sizes: [{ value: "8mm" }],
      colors: [{ name: "Gold", imageUrl: IMG }],
      stock: [{ color: "Gold", size: "8mm", quantity: 1.5 }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Gold · 8mm");
    const big = validateVariants({
      sizeLabel: "L",
      sizes: [{ value: "8mm" }],
      colors: [],
      stock: [{ size: "8mm", quantity: 1_000_000 }],
    });
    expect(big.ok).toBe(false);
  });

  it("passes size and colour errors through", () => {
    expect(validateVariants({ sizeLabel: "", sizes: "x", colors: [], stock: [] }).ok).toBe(false);
    expect(validateVariants({ sizeLabel: "", sizes: [], colors: [{ name: "Gold" }], stock: [] }).ok).toBe(false);
    expect(validateVariants({ sizeLabel: "", sizes: [], colors: [], stock: "x" }).ok).toBe(false);
  });
});

describe("stockFromVariants", () => {
  it("sums the lines, or falls back with none", () => {
    expect(stockFromVariants([{ quantity: 4 }, { quantity: 8 }], 99)).toBe(12);
    expect(stockFromVariants([], 7)).toBe(7);
    expect(stockFromVariants([{ quantity: 0 }], 50)).toBe(0);
  });
});

describe("variantSku", () => {
  it("joins the product SKU, colour and size, uppercased", () => {
    expect(variantSku("SB-LABRET", ["Gold", "8mm"])).toBe("SB-LABRET-GOLD-8MM");
    expect(variantSku("SB-ROSEGOLD14", [null, "8mm"])).toBe("SB-ROSEGOLD14-8MM");
    expect(variantSku("SB-1", ["Rose Gold", null])).toBe("SB-1-ROSE-GOLD");
  });

  it("collapses punctuation and spaces into single dashes", () => {
    expect(variantSku("sb-1", [null, "1 1/2 in"])).toBe("SB-1-1-1-2-IN");
  });

  it("falls back to SIZE when nothing alphanumeric is left", () => {
    expect(variantSku("SB-1", [null, "—"])).toBe("SB-1-SIZE");
  });
});

describe("variantsSummary", () => {
  it("reads as a list of line and count", () => {
    expect(
      variantsSummary("Length", [
        { value: "Gold · 6mm", quantity: 4, additionalPrice: null },
        { value: "Gold · 8mm", quantity: 0, additionalPrice: 5 },
      ]),
    ).toBe("Length: Gold · 6mm ×4, Gold · 8mm ×0 +$5.00");
    expect(variantsSummary(null, [{ value: "Gold", quantity: 1, additionalPrice: null }])).toBe("Gold ×1");
  });

  it("says so when there are none", () => {
    expect(variantsSummary(null, [])).toBe("no sizes or colours");
  });

  it("changes when only an extra price changes, so the edit is logged", () => {
    const before = variantsSummary("L", [{ value: "8mm", quantity: 2, additionalPrice: 5 }]);
    const after = variantsSummary("L", [{ value: "8mm", quantity: 2, additionalPrice: 7.5 }]);
    expect(before).not.toBe(after);
  });
});

describe("matchVariants", () => {
  const size = (value: string, previous: string | null = value): SizeRow => ({
    previous,
    value,
    additionalPrice: null,
  });
  const line = (colorIndex: number | null, s: string | null) => ({
    colorIndex,
    size: s,
    value: variantLabel(colorIndex === null ? null : `C${colorIndex}`, s),
    quantity: 0,
    additionalPrice: null,
  });
  const ex = (id: string, colorId: string | null, s: string | null): ExistingVariant => ({
    id,
    colorId,
    size: s,
    value: id,
  });

  it("keeps sizes in place and creates new ones", () => {
    const r = matchVariants(
      [ex("v6", null, "6mm"), ex("v8", null, "8mm")],
      [line(null, "6mm"), line(null, "8mm"), line(null, "10mm")],
      [],
      [size("6mm"), size("8mm"), size("10mm", null)],
    );
    expect(r).toEqual({ ids: ["v6", "v8", null], removed: [] });
  });

  it("follows a renamed size, even when two sizes swap names", () => {
    const r = matchVariants(
      [ex("v6", null, "6mm"), ex("v8", null, "8mm")],
      [line(null, "8mm"), line(null, "6mm")],
      [],
      [size("8mm", "6mm"), size("6mm", "8mm")],
    );
    expect(r.ids).toEqual(["v6", "v8"]);
  });

  it("removes a size that was dropped", () => {
    const r = matchVariants([ex("v6", null, "6mm"), ex("v8", null, "8mm")], [line(null, "6mm")], [], [size("6mm")]);
    expect(r.ids).toEqual(["v6"]);
    expect(r.removed.map((v) => v.id)).toEqual(["v8"]);
  });

  it("moves sizes under the first colour when a sized product gains colours", () => {
    const r = matchVariants(
      [ex("v6", null, "6mm"), ex("v8", null, "8mm")],
      [line(0, "6mm"), line(0, "8mm"), line(1, "6mm"), line(1, "8mm")],
      ["gold", "silver"],
      [size("6mm"), size("8mm")],
    );
    expect(r).toEqual({ ids: ["v6", "v8", null, null], removed: [] });
  });

  it("gives a coloured product's lines the first size when it gains sizes", () => {
    const r = matchVariants(
      [ex("vg", "gold", null), ex("vs", "silver", null)],
      [line(0, "6mm"), line(0, "8mm"), line(1, "6mm"), line(1, "8mm")],
      ["gold", "silver"],
      [size("6mm", null), size("8mm", null)],
    );
    expect(r.ids).toEqual(["vg", null, "vs", null]);
  });

  it("follows a colour by id and removes the lines of a dropped colour", () => {
    const r = matchVariants(
      [ex("vg8", "gold", "8mm"), ex("vs8", "silver", "8mm")],
      [line(0, "8mm")],
      ["silver"],
      [size("8mm")],
    );
    expect(r.ids).toEqual(["vs8"]);
    expect(r.removed.map((v) => v.id)).toEqual(["vg8"]);
  });

  it("keeps the first line per size when colours are dropped altogether", () => {
    const r = matchVariants(
      [ex("vg8", "gold", "8mm"), ex("vs8", "silver", "8mm")],
      [line(null, "8mm")],
      [],
      [size("8mm")],
    );
    expect(r.ids).toEqual(["vg8"]);
    expect(r.removed.map((v) => v.id)).toEqual(["vs8"]);
  });
});
