// Pure validation for the promo-code form, shared by the admin modal and the
// API route. No I/O and no server-only imports, so it runs on both sides and is
// unit-testable — same split as contact/validate.ts.

export type PromoFormData = {
  code: string;
  /** Exactly one of these two is set; the other is null. */
  percentageOff: number | null;
  amountOff: number | null;
  usageLimit: number | null;
  /** ISO date (yyyy-mm-dd) or "" for no expiry. */
  expiresAt: string;
  active: boolean;
};

export const PROMO_LIMITS = {
  codeMin: 3,
  codeMax: 24,
  maxPercentage: 100,
  maxAmount: 10_000,
} as const;

// Letters and digits only. Codes get typed by hand off a phone screen, and a
// hyphen or space is the kind of thing that turns into a support message.
const CODE_RE = /^[A-Z0-9]+$/;

export type PromoCheck =
  | { ok: true; data: PromoFormData }
  | { ok: false; error: string };

/** Uppercased and stripped of spaces, matching how the checkout looks codes up. */
export function normalisePromoCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function validatePromo(raw: {
  code?: unknown;
  percentageOff?: unknown;
  amountOff?: unknown;
  usageLimit?: unknown;
  expiresAt?: unknown;
  active?: unknown;
}): PromoCheck {
  const code = normalisePromoCode(typeof raw.code === "string" ? raw.code : "");
  if (!code) return { ok: false, error: "Enter a code." };
  if (code.length < PROMO_LIMITS.codeMin) {
    return { ok: false, error: `Codes must be at least ${PROMO_LIMITS.codeMin} characters.` };
  }
  if (code.length > PROMO_LIMITS.codeMax) {
    return { ok: false, error: `Codes must be ${PROMO_LIMITS.codeMax} characters or fewer.` };
  }
  if (!CODE_RE.test(code)) {
    return { ok: false, error: "Use letters and numbers only — no spaces or symbols." };
  }

  const percentageOff = optionalNumber(raw.percentageOff);
  const amountOff = optionalNumber(raw.amountOff);

  // The checkout applies percentage OR amount, never both, so the form must not
  // be able to save a code whose value is ambiguous.
  if (percentageOff === null && amountOff === null) {
    return { ok: false, error: "Set either a percentage or an amount off." };
  }
  if (percentageOff !== null && amountOff !== null) {
    return { ok: false, error: "Choose one — a percentage or a fixed amount, not both." };
  }

  if (percentageOff !== null) {
    if (!Number.isInteger(percentageOff) || percentageOff < 1) {
      return { ok: false, error: "Percentage must be a whole number of at least 1." };
    }
    if (percentageOff > PROMO_LIMITS.maxPercentage) {
      return { ok: false, error: "Percentage cannot be more than 100." };
    }
  }

  if (amountOff !== null) {
    if (!Number.isFinite(amountOff) || amountOff <= 0) {
      return { ok: false, error: "Amount off must be more than zero." };
    }
    if (amountOff > PROMO_LIMITS.maxAmount) {
      return { ok: false, error: "That amount looks like a typo — keep it under $10,000." };
    }
  }

  const usageLimit = optionalNumber(raw.usageLimit);
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
    return { ok: false, error: "Usage limit must be a whole number of at least 1." };
  }

  const expiresAt = typeof raw.expiresAt === "string" ? raw.expiresAt.trim() : "";
  if (expiresAt) {
    const when = new Date(expiresAt);
    if (Number.isNaN(when.getTime())) {
      return { ok: false, error: "That expiry date isn't valid." };
    }
  }

  return {
    ok: true,
    data: {
      code,
      percentageOff,
      amountOff: amountOff === null ? null : round2(amountOff),
      usageLimit,
      expiresAt,
      active: raw.active !== false,
    },
  };
}

/** Blank, null and undefined all mean "not set"; anything else must be a number. */
function optionalNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? NaN : n;
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

/** "20% off" / "$50.00 off" — the label shown to the customer at checkout. */
export function promoLabel(percentageOff: number | null, amountOff: number | null): string {
  if (percentageOff != null) return `${percentageOff}% off`;
  if (amountOff != null) return `$${amountOff.toFixed(2)} off`;
  return "discount";
}

export type PromoState = "Active" | "Inactive" | "Expired" | "Used up";

/**
 * What the checkout will actually do with this code today.
 *
 * Mirrors the usability test in /api/checkout so the admin screen cannot show
 * "Active" for a code the checkout would refuse.
 */
export function promoState(row: {
  active: boolean;
  expiresAt: Date | string | null;
  usageLimit: number | null;
  timesUsed: number;
}): PromoState {
  if (!row.active) return "Inactive";
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) return "Expired";
  if (row.usageLimit != null && row.timesUsed >= row.usageLimit) return "Used up";
  return "Active";
}
