import { describe, expect, it } from "vitest";
import {
  DEFAULT_WINDOW_HOURS,
  RECEIPT_MAX_BYTES,
  bankDetails,
  canReviewPayment,
  canSubmitReceipt,
  isExpired,
  paymentDeadline,
  paymentWindowHours,
  receiptKey,
  timeRemaining,
  validateReceipt,
} from "./bank-transfer";

const at = (iso: string) => new Date(iso);

describe("paymentWindowHours", () => {
  it("uses the configured value", () => {
    expect(paymentWindowHours("12")).toBe(12);
  });

  it("falls back when unset or unparseable", () => {
    expect(paymentWindowHours(undefined)).toBe(DEFAULT_WINDOW_HOURS);
    expect(paymentWindowHours("")).toBe(DEFAULT_WINDOW_HOURS);
    expect(paymentWindowHours("soon")).toBe(DEFAULT_WINDOW_HOURS);
    expect(paymentWindowHours("   ")).toBe(DEFAULT_WINDOW_HOURS);
  });

  it("clamps a zero or negative window, which would expire orders instantly", () => {
    expect(paymentWindowHours("0")).toBe(1);
    expect(paymentWindowHours("-5")).toBe(1);
  });

  it("clamps an absurdly long window", () => {
    expect(paymentWindowHours("100000")).toBe(24 * 14);
  });

  it("floors a fractional value", () => {
    expect(paymentWindowHours("6.9")).toBe(6);
  });
});

describe("paymentDeadline", () => {
  it("adds the window to the placement time", () => {
    expect(paymentDeadline(at("2026-09-08T17:00:00Z"), 6).toISOString()).toBe(
      "2026-09-08T23:00:00.000Z",
    );
  });
});

describe("bankDetails", () => {
  const full = {
    BANK_TRANSFER_BANK_NAME: "Republic Bank",
    BANK_TRANSFER_ACCOUNT_NAME: "SherryBerries Ltd",
    BANK_TRANSFER_ACCOUNT_NUMBER: "1234567890",
  };

  it("returns all three, trimmed", () => {
    expect(bankDetails({ ...full, BANK_TRANSFER_BANK_NAME: "  Republic Bank " })).toEqual({
      bankName: "Republic Bank",
      accountName: "SherryBerries Ltd",
      accountNumber: "1234567890",
      accountType: "Savings",
    });
  });

  it("returns null when any one is missing, rather than a half-filled panel", () => {
    for (const key of Object.keys(full)) {
      expect(bankDetails({ ...full, [key]: "" })).toBeNull();
    }
    expect(bankDetails({})).toBeNull();
  });

  // Unlike the other three, a missing account type must not disable bank
  // transfer — losing a payment method over a label would be a worse outcome
  // than showing the account's actual type, which the owner confirmed.
  it("defaults the account type to Savings", () => {
    expect(bankDetails(full)?.accountType).toBe("Savings");
    expect(bankDetails({ ...full, BANK_TRANSFER_ACCOUNT_TYPE: "" })?.accountType).toBe("Savings");
    expect(bankDetails({ ...full, BANK_TRANSFER_ACCOUNT_TYPE: "   " })?.accountType).toBe("Savings");
  });

  it("lets the environment override the account type, trimmed", () => {
    expect(bankDetails({ ...full, BANK_TRANSFER_ACCOUNT_TYPE: " Chequing " })?.accountType).toBe(
      "Chequing",
    );
  });
});

describe("isExpired", () => {
  const deadline = at("2026-09-08T23:00:00Z");

  it("expires an unpaid order past its deadline", () => {
    expect(isExpired("AWAITING_PAYMENT", deadline, at("2026-09-08T23:00:01Z"))).toBe(true);
  });

  it("does not expire before the deadline", () => {
    expect(isExpired("AWAITING_PAYMENT", deadline, at("2026-09-08T22:59:59Z"))).toBe(false);
  });

  it("expires exactly on the deadline", () => {
    expect(isExpired("AWAITING_PAYMENT", deadline, deadline)).toBe(true);
  });

  // Spec §18 — the case the whole design turns on.
  it("NEVER expires an order whose receipt is awaiting review", () => {
    expect(isExpired("PAYMENT_SUBMITTED", deadline, at("2030-01-01T00:00:00Z"))).toBe(false);
  });

  it("leaves settled states alone", () => {
    for (const s of ["PAID", "EXPIRED", "PENDING"]) {
      expect(isExpired(s, deadline, at("2030-01-01T00:00:00Z"))).toBe(false);
    }
  });

  // A rejection sets a fresh deadline. Without expiry it would be a dead end
  // holding its stock forever, clearable only by hand.
  it("expires a rejected order past its fresh deadline", () => {
    expect(isExpired("REJECTED", deadline, at("2026-09-08T23:00:01Z"))).toBe(true);
    expect(isExpired("REJECTED", deadline, at("2026-09-08T22:00:00Z"))).toBe(false);
  });

  it("does not expire an order with no deadline, such as a card order", () => {
    expect(isExpired("AWAITING_PAYMENT", null, at("2030-01-01T00:00:00Z"))).toBe(false);
  });
});

describe("canSubmitReceipt", () => {
  const deadline = at("2026-09-08T23:00:00Z");
  const before = at("2026-09-08T22:00:00Z");
  const after = at("2026-09-09T01:00:00Z");

  it("allows an unpaid order inside the window", () => {
    expect(canSubmitReceipt("AWAITING_PAYMENT", deadline, before)).toBe(true);
  });

  it("refuses once the window has closed, even before the sweep runs", () => {
    expect(canSubmitReceipt("AWAITING_PAYMENT", deadline, after)).toBe(false);
  });

  it("allows a resubmission after a rejection, inside its fresh window", () => {
    expect(canSubmitReceipt("REJECTED", deadline, before)).toBe(true);
  });

  it("refuses a resubmission once that fresh window has closed too", () => {
    expect(canSubmitReceipt("REJECTED", deadline, after)).toBe(false);
  });

  it("refuses a second receipt while one is already under review", () => {
    expect(canSubmitReceipt("PAYMENT_SUBMITTED", deadline, before)).toBe(false);
  });

  it("refuses on a paid or expired order", () => {
    expect(canSubmitReceipt("PAID", deadline, before)).toBe(false);
    expect(canSubmitReceipt("EXPIRED", deadline, before)).toBe(false);
  });
});

describe("canReviewPayment", () => {
  it("only a submitted receipt can be confirmed or rejected", () => {
    expect(canReviewPayment("PAYMENT_SUBMITTED")).toBe(true);
    for (const s of ["AWAITING_PAYMENT", "PAID", "REJECTED", "EXPIRED"]) {
      expect(canReviewPayment(s)).toBe(false);
    }
  });
});

describe("validateReceipt", () => {
  it("accepts each allowed type and reports its extension", () => {
    expect(validateReceipt("image/jpeg", 1000)).toEqual({
      ok: true,
      mime: "image/jpeg",
      extension: "jpg",
    });
    expect(validateReceipt("application/pdf", 1000)).toMatchObject({ extension: "pdf" });
  });

  it("tolerates a charset parameter and odd casing", () => {
    expect(validateReceipt("IMAGE/PNG; charset=binary", 10).ok).toBe(true);
  });

  it("rejects a type that is not allowed", () => {
    expect(validateReceipt("image/svg+xml", 10).ok).toBe(false);
    expect(validateReceipt("application/x-msdownload", 10).ok).toBe(false);
    expect(validateReceipt("", 10).ok).toBe(false);
    expect(validateReceipt(undefined, 10).ok).toBe(false);
  });

  it("rejects an empty file", () => {
    expect(validateReceipt("image/jpeg", 0).ok).toBe(false);
    expect(validateReceipt("image/jpeg", undefined).ok).toBe(false);
  });

  it("rejects a file over the size cap but accepts one exactly at it", () => {
    expect(validateReceipt("image/jpeg", RECEIPT_MAX_BYTES + 1).ok).toBe(false);
    expect(validateReceipt("image/jpeg", RECEIPT_MAX_BYTES).ok).toBe(true);
  });
});

describe("receiptKey", () => {
  it("namespaces by order and uses the generated name", () => {
    expect(receiptKey("SB-1048", "jpg", "c9d830fe")).toBe("payments/SB-1048/c9d830fe.jpg");
  });

  it("strips anything path-like from the order number", () => {
    expect(receiptKey("../../etc/passwd", "png", "r")).toBe("payments/etcpasswd/r.png");
  });
});

describe("timeRemaining", () => {
  const now = at("2026-09-08T18:00:00Z");

  it("reads as hours and minutes", () => {
    expect(timeRemaining(at("2026-09-08T22:32:00Z"), now)).toBe("4h 32m");
  });

  it("drops the hours under an hour", () => {
    expect(timeRemaining(at("2026-09-08T18:07:00Z"), now)).toBe("7m");
  });

  it("says Expired once past", () => {
    expect(timeRemaining(at("2026-09-08T17:59:00Z"), now)).toBe("Expired");
  });

  it("has nothing to show without a deadline", () => {
    expect(timeRemaining(null, now)).toBe("—");
  });
});
