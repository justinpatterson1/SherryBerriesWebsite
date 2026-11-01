import { describe, expect, it } from "vitest";
import { DEFAULT_SIZE_LABEL, SIZES_MAX, validateSizes } from "./sizes";

describe("validateSizes", () => {
  it("accepts no sizes and reports no label", () => {
    expect(validateSizes("", [])).toEqual({ ok: true, label: null, sizes: [] });
    expect(validateSizes(undefined, undefined)).toEqual({ ok: true, label: null, sizes: [] });
  });

  it("defaults the label when rows exist without one", () => {
    const r = validateSizes("", [{ value: "8mm" }]);
    expect(r).toMatchObject({ ok: true, label: DEFAULT_SIZE_LABEL });
  });

  it("keeps a label the admin chose", () => {
    const r = validateSizes("  Gauge ", [{ value: "16G" }]);
    expect(r).toMatchObject({ ok: true, label: "Gauge" });
  });

  it("trims values and carries the previous value through", () => {
    const r = validateSizes("Length", [{ previous: "10 mm", value: "  10mm  " }]);
    expect(r).toEqual({
      ok: true,
      label: "Length",
      sizes: [{ previous: "10 mm", value: "10mm", additionalPrice: null }],
    });
  });

  it("treats a missing previous value as a new size", () => {
    const r = validateSizes("Length", [{ value: "8mm" }, { previous: "", value: "10mm" }]);
    if (r.ok) expect(r.sizes.map((s) => s.previous)).toEqual([null, null]);
  });

  it("drops blank rows instead of failing, so an untouched new row is harmless", () => {
    const r = validateSizes("Length", [{ value: "8mm" }, { value: "   " }]);
    expect(r).toMatchObject({ ok: true });
    if (r.ok) expect(r.sizes).toHaveLength(1);
  });

  it("rejects the same size twice, case-insensitively", () => {
    const r = validateSizes("Gauge", [{ value: "16G" }, { value: "16g" }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("listed twice");
  });

  it("treats an empty extra price as none and rounds a real one", () => {
    const a = validateSizes("L", [{ value: "8mm", additionalPrice: "" }]);
    if (a.ok) expect(a.sizes[0].additionalPrice).toBeNull();
    const b = validateSizes("L", [{ value: "8mm", additionalPrice: 2.567 }]);
    if (b.ok) expect(b.sizes[0].additionalPrice).toBe(2.57);
  });

  it("rejects a negative extra price", () => {
    expect(validateSizes("L", [{ value: "8mm", additionalPrice: -1 }]).ok).toBe(false);
  });

  it("rejects more rows than the cap", () => {
    const many = Array.from({ length: SIZES_MAX + 1 }, (_, i) => ({ value: `${i}mm` }));
    expect(validateSizes("L", many).ok).toBe(false);
  });

  it("rejects a non-array", () => {
    expect(validateSizes("L", "8mm").ok).toBe(false);
  });

  it("rejects an over-long label or value", () => {
    expect(validateSizes("x".repeat(25), [{ value: "8mm" }]).ok).toBe(false);
    expect(validateSizes("L", [{ value: "x".repeat(25) }]).ok).toBe(false);
  });
});
