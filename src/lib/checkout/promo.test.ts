import { describe, expect, it } from "vitest";
import { applyPromo, discountFor, eligibleSubtotal } from "./promo";

// Category ids, named for what they stand in for.
const JEWELRY = "cat_jewelry";
const MERCH = "cat_merch";
const AFTERCARE = "cat_aftercare";

const line = (categoryId: string, unitPrice: number, quantity = 1) => ({
  categoryId,
  unitPrice,
  quantity,
});

describe("eligibleSubtotal", () => {
  it("is the whole subtotal when nothing is excluded", () => {
    const lines = [line(JEWELRY, 100), line(MERCH, 80, 2)];
    expect(eligibleSubtotal(lines, [])).toBe(260);
  });

  it("leaves out lines in an excluded category", () => {
    const lines = [line(JEWELRY, 100), line(MERCH, 80)];
    expect(eligibleSubtotal(lines, [MERCH])).toBe(100);
  });

  it("counts quantity, not just the line", () => {
    const lines = [line(JEWELRY, 25, 4), line(MERCH, 80)];
    expect(eligibleSubtotal(lines, [MERCH])).toBe(100);
  });

  it("is zero when every line is excluded", () => {
    const lines = [line(MERCH, 80), line(AFTERCARE, 30)];
    expect(eligibleSubtotal(lines, [MERCH, AFTERCARE])).toBe(0);
  });
});

describe("discountFor", () => {
  it("takes a percentage of the eligible portion only", () => {
    const rules = { percentageOff: 20, amountOff: null, excludedCategoryIds: [MERCH] };
    expect(discountFor(rules, 100)).toBe(20);
  });

  // The bug this prevents: a $50-off code on a bag holding $20 of eligible
  // goods and $200 of excluded ones must take off $20, not $50. Capping
  // against the full subtotal instead would let a fixed-amount code spend the
  // excluded items' value and defeat the exclusion entirely.
  it("caps a fixed amount at the eligible portion, not the whole bag", () => {
    const rules = { percentageOff: null, amountOff: 50, excludedCategoryIds: [MERCH] };
    expect(discountFor(rules, 20)).toBe(20);
  });

  it("discounts nothing when no line is eligible", () => {
    const rules = { percentageOff: 20, amountOff: null, excludedCategoryIds: [MERCH] };
    expect(discountFor(rules, 0)).toBe(0);
  });

  it("rounds to cents", () => {
    const rules = { percentageOff: 15, amountOff: null, excludedCategoryIds: [] };
    expect(discountFor(rules, 33.33)).toBe(5);
  });
});

describe("applyPromo", () => {
  it("discounts the eligible part of a mixed bag", () => {
    const rules = { percentageOff: 20, amountOff: null, excludedCategoryIds: [MERCH] };
    const lines = [line(JEWELRY, 100), line(MERCH, 80)];
    expect(applyPromo(rules, lines)).toEqual({ eligible: 100, discount: 20 });
  });

  it("gives nothing off a bag of only excluded items", () => {
    const rules = { percentageOff: 20, amountOff: null, excludedCategoryIds: [MERCH] };
    expect(applyPromo(rules, [line(MERCH, 80)])).toEqual({ eligible: 0, discount: 0 });
  });

  it("behaves like the old whole-bag math when there are no exclusions", () => {
    const rules = { percentageOff: 10, amountOff: null, excludedCategoryIds: [] };
    const lines = [line(JEWELRY, 100), line(MERCH, 80)];
    expect(applyPromo(rules, lines)).toEqual({ eligible: 180, discount: 18 });
  });
});
