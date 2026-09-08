import { describe, expect, it } from "vitest";
import {
  DEFAULT_SIZE_LABEL,
  SIZES_MAX,
  sizesSummary,
  stockFromSizes,
  validateSizes,
  variantSku,
  type SizeRow,
} from "./sizes";

const row = (over: Partial<SizeRow> = {}): SizeRow => ({
  id: null,
  value: "8mm",
  quantity: 3,
  additionalPrice: null,
  ...over,
});

describe("validateSizes", () => {
  it("accepts no sizes and reports no label", () => {
    expect(validateSizes("", [])).toEqual({ ok: true, label: null, sizes: [] });
    expect(validateSizes(undefined, undefined)).toEqual({ ok: true, label: null, sizes: [] });
  });

  it("defaults the label when rows exist without one", () => {
    const r = validateSizes("", [{ value: "8mm", quantity: 2 }]);
    expect(r).toMatchObject({ ok: true, label: DEFAULT_SIZE_LABEL });
  });

  it("keeps a label the admin chose", () => {
    const r = validateSizes("  Gauge ", [{ value: "16G", quantity: 1 }]);
    expect(r).toMatchObject({ ok: true, label: "Gauge" });
  });

  it("trims values and carries the row id through", () => {
    const r = validateSizes("Length", [{ id: "v1", value: "  10mm  ", quantity: 4 }]);
    expect(r).toEqual({
      ok: true,
      label: "Length",
      sizes: [{ id: "v1", value: "10mm", quantity: 4, additionalPrice: null }],
    });
  });

  it("drops blank rows instead of failing, so an untouched new row is harmless", () => {
    const r = validateSizes("Length", [
      { value: "8mm", quantity: 1 },
      { value: "   ", quantity: 0 },
    ]);
    expect(r).toMatchObject({ ok: true });
    if (r.ok) expect(r.sizes).toHaveLength(1);
  });

  it("rejects the same size twice, case-insensitively", () => {
    const r = validateSizes("Gauge", [
      { value: "16G", quantity: 1 },
      { value: "16g", quantity: 2 },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("listed twice");
  });

  it("rejects a non-integer, negative, or absent quantity", () => {
    expect(validateSizes("L", [{ value: "8mm", quantity: 1.5 }]).ok).toBe(false);
    expect(validateSizes("L", [{ value: "8mm", quantity: -1 }]).ok).toBe(false);
    expect(validateSizes("L", [{ value: "8mm" }]).ok).toBe(false);
    expect(validateSizes("L", [{ value: "8mm", quantity: "3" }]).ok).toBe(false);
  });

  it("accepts a zero quantity — out of stock is a real state", () => {
    const r = validateSizes("L", [{ value: "8mm", quantity: 0 }]);
    expect(r).toMatchObject({ ok: true });
    if (r.ok) expect(r.sizes[0].quantity).toBe(0);
  });

  it("treats an empty extra price as none and rounds a real one", () => {
    const a = validateSizes("L", [{ value: "8mm", quantity: 1, additionalPrice: "" }]);
    if (a.ok) expect(a.sizes[0].additionalPrice).toBeNull();
    const b = validateSizes("L", [{ value: "8mm", quantity: 1, additionalPrice: 2.567 }]);
    if (b.ok) expect(b.sizes[0].additionalPrice).toBe(2.57);
  });

  it("rejects a negative extra price", () => {
    expect(validateSizes("L", [{ value: "8mm", quantity: 1, additionalPrice: -1 }]).ok).toBe(false);
  });

  it("rejects more rows than the cap", () => {
    const many = Array.from({ length: SIZES_MAX + 1 }, (_, i) => ({
      value: `${i}mm`,
      quantity: 1,
    }));
    expect(validateSizes("L", many).ok).toBe(false);
  });

  it("rejects a non-array", () => {
    expect(validateSizes("L", "8mm").ok).toBe(false);
  });

  it("rejects an over-long label or value", () => {
    expect(validateSizes("x".repeat(25), [{ value: "8mm", quantity: 1 }]).ok).toBe(false);
    expect(validateSizes("L", [{ value: "x".repeat(25), quantity: 1 }]).ok).toBe(false);
  });
});

describe("stockFromSizes", () => {
  it("sums the sizes when there are any", () => {
    expect(stockFromSizes([row({ quantity: 4 }), row({ value: "10mm", quantity: 8 })], 99)).toBe(12);
  });

  it("falls back to the hand-entered figure with no sizes", () => {
    expect(stockFromSizes([], 7)).toBe(7);
  });

  it("sums to zero rather than falling back when every size is empty", () => {
    expect(stockFromSizes([row({ quantity: 0 })], 50)).toBe(0);
  });
});

describe("variantSku", () => {
  it("joins the product SKU and the size, uppercased", () => {
    expect(variantSku("SB-ROSEGOLD14", "8mm")).toBe("SB-ROSEGOLD14-8MM");
  });

  it("collapses punctuation and spaces into single dashes", () => {
    expect(variantSku("sb-1", "1 1/2 in")).toBe("SB-1-1-1-2-IN");
  });

  it("falls back to SIZE when the value has nothing alphanumeric", () => {
    expect(variantSku("SB-1", "—")).toBe("SB-1-SIZE");
  });

  it("gives distinct SKUs to distinct sizes of one product", () => {
    expect(variantSku("SB-1", "8mm")).not.toBe(variantSku("SB-1", "10mm"));
  });
});

describe("sizesSummary", () => {
  it("reads as a list of size and count", () => {
    expect(sizesSummary("Length", [row({ value: "6mm", quantity: 4 }), row({ value: "8mm", quantity: 0 })])).toBe(
      "Length: 6mm ×4, 8mm ×0",
    );
  });

  it("says so when there are none", () => {
    expect(sizesSummary(null, [])).toBe("no sizes");
  });
});
