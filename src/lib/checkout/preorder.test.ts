import { describe, it, expect } from "vitest";
import { hasPreorder, ignoresStock, isMixedPreorderCart } from "./preorder";

const regular = { isPreorder: false };
const preorder = { isPreorder: true };

describe("hasPreorder", () => {
  it("is true when any line is a preorder", () => {
    expect(hasPreorder([preorder])).toBe(true);
    expect(hasPreorder([regular, preorder])).toBe(true);
  });

  it("is false for a regular or empty cart", () => {
    expect(hasPreorder([regular])).toBe(false);
    expect(hasPreorder([])).toBe(false);
  });
});

describe("isMixedPreorderCart", () => {
  it("is true only when preorder and regular lines sit together", () => {
    expect(isMixedPreorderCart([preorder, regular])).toBe(true);
  });

  it("is false for a cart of one kind", () => {
    expect(isMixedPreorderCart([preorder, preorder])).toBe(false);
    expect(isMixedPreorderCart([regular, regular])).toBe(false);
    expect(isMixedPreorderCart([])).toBe(false);
  });
});

describe("ignoresStock", () => {
  it("skips stock for downloads and preorders", () => {
    expect(ignoresStock({ isDigital: true, isPreorder: false })).toBe(true);
    expect(ignoresStock({ isDigital: false, isPreorder: true })).toBe(true);
  });

  it("counts stock for a regular physical piece", () => {
    expect(ignoresStock({ isDigital: false, isPreorder: false })).toBe(false);
  });
});
