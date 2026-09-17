import { describe, it, expect } from "vitest";
import { canMarkPaid, canDownloadDigital } from "./payment-transitions";

describe("canMarkPaid", () => {
  it("allows a pending order to be recorded as paid", () => {
    expect(canMarkPaid("PENDING")).toBe(true);
  });

  // A bank transfer is excluded on purpose: it goes through /api/admin/payments
  // so the receipt is stamped and the right email goes out.
  it("refuses every already-resolved or bank-transfer state", () => {
    for (const s of [
      "PAID",
      "FAILED",
      "REFUNDED",
      "AWAITING_PAYMENT",
      "PAYMENT_SUBMITTED",
      "REJECTED",
      "EXPIRED",
    ]) {
      expect(canMarkPaid(s)).toBe(false);
    }
  });

  it("refuses unknown or wrongly-cased input", () => {
    expect(canMarkPaid("pending")).toBe(false);
    expect(canMarkPaid("")).toBe(false);
  });
});

describe("canDownloadDigital", () => {
  it("serves a paid digital product that has a file", () => {
    expect(canDownloadDigital("PAID", true, true)).toBe(true);
  });

  it("refuses until the order is paid", () => {
    for (const s of ["PENDING", "AWAITING_PAYMENT", "PAYMENT_SUBMITTED", "FAILED", "EXPIRED"]) {
      expect(canDownloadDigital(s, true, true)).toBe(false);
    }
  });

  it("refuses a product that is not digital, or has no file", () => {
    expect(canDownloadDigital("PAID", false, true)).toBe(false);
    expect(canDownloadDigital("PAID", true, false)).toBe(false);
  });
});
