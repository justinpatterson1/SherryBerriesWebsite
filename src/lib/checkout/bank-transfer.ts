// Bank transfer rules and configuration.
//
// Pure: no I/O and no server-only imports, so the checkout API, the customer
// payment page, the admin views and the expiry sweep all share one source of
// truth for what "expired" means — and it is unit-testable.
//
// The core business rule the spec is built around:
//
//   A receipt is evidence the customer CLAIMS to have transferred money. It is
//   not confirmation SherryBerries received it. Only an admin who checked the
//   bank account may move a payment to PAID.
//
// Everything here exists to keep that true.

/** Upload limits, enforced server-side — never from the browser's filename. */
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

export const RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type ReceiptMime = (typeof RECEIPT_MIME_TYPES)[number];

/** Extension per accepted type. Receipts are stored under generated names, so
 *  this is only used to build that name — never the customer's own filename. */
const EXTENSION: Record<ReceiptMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Fallback when BANK_TRANSFER_PAYMENT_WINDOW_HOURS is unset or unusable. */
export const DEFAULT_WINDOW_HOURS = 6;
const MIN_WINDOW_HOURS = 1;
const MAX_WINDOW_HOURS = 24 * 14;

/**
 * How long a bank transfer order holds its stock.
 *
 * Read from the environment so it can be tuned without a deploy, but clamped:
 * a typo of `0` would expire every order the moment it was placed, and a
 * missing value must not mean "never expires".
 */
export function paymentWindowHours(raw: string | undefined = process.env.BANK_TRANSFER_PAYMENT_WINDOW_HOURS): number {
  // Trim first and treat blank as unset: Number("") is 0, which is finite,
  // so a `BANK_TRANSFER_PAYMENT_WINDOW_HOURS=` line with nothing after it
  // would otherwise clamp to the 1-hour minimum instead of the default.
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return DEFAULT_WINDOW_HOURS;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return DEFAULT_WINDOW_HOURS;
  const whole = Math.floor(n);
  if (whole < MIN_WINDOW_HOURS) return MIN_WINDOW_HOURS;
  if (whole > MAX_WINDOW_HOURS) return MAX_WINDOW_HOURS;
  return whole;
}

/** The deadline for an order placed at `from`. */
export function paymentDeadline(from: Date, hours = paymentWindowHours()): Date {
  return new Date(from.getTime() + hours * 3600_000);
}

export type BankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

/**
 * The account the customer transfers to.
 *
 * All three must be set. Returning null rather than a half-filled panel is
 * deliberate: an instructions page missing the account number would have the
 * customer believe they can pay when they cannot, and the order is already
 * holding stock by then.
 */
export function bankDetails(
  env: Record<string, string | undefined> = process.env,
): BankDetails | null {
  const bankName = env.BANK_TRANSFER_BANK_NAME?.trim() ?? "";
  const accountName = env.BANK_TRANSFER_ACCOUNT_NAME?.trim() ?? "";
  const accountNumber = env.BANK_TRANSFER_ACCOUNT_NUMBER?.trim() ?? "";
  if (!bankName || !accountName || !accountNumber) return null;
  return { bankName, accountName, accountNumber };
}

/** Payment states a bank transfer order can be in. */
export type BankPaymentStatus =
  | "AWAITING_PAYMENT"
  | "PAYMENT_SUBMITTED"
  | "PAID"
  | "REJECTED"
  | "EXPIRED";

/**
 * Whether an order should be expired now.
 *
 * The exception in spec §18 is the important part: a receipt filed at 10:55 for
 * an 11:00 deadline must NOT be cancelled at 11:00. The customer did their
 * part; the delay is ours. So PAYMENT_SUBMITTED is never expired on the clock,
 * however long review takes.
 *
 * REJECTED expires too, on the fresh deadline set when it was rejected.
 * Without that, a rejected order would hold its stock forever: nothing else
 * moves it, and an admin would have to remember to cancel it by hand.
 */
export const EXPIRABLE_STATUSES = ["AWAITING_PAYMENT", "REJECTED"] as const;

export function isExpired(
  status: string,
  expiresAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (!(EXPIRABLE_STATUSES as readonly string[]).includes(status)) return false;
  if (!expiresAt) return false;
  return expiresAt.getTime() <= now.getTime();
}

/**
 * Whether a customer may upload a receipt against this order.
 *
 * REJECTED is allowed on purpose — a rejection for the wrong amount should be
 * fixable by transferring again and resubmitting, which is why receipt history
 * exists rather than one overwritten file. It gets a fresh window when it is
 * rejected, and is refused once that closes like any other lapsed order.
 */
export function canSubmitReceipt(
  status: string,
  expiresAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (!(EXPIRABLE_STATUSES as readonly string[]).includes(status)) return false;
  // An order past its deadline is treated as closed even before the sweep has
  // marked it, so the two never disagree about what is still payable.
  return !isExpired(status, expiresAt, now);
}

/**
 * Why a submitted receipt was refused.
 *
 * Shared by the admin UI and the API so the dropdown and the validation
 * cannot drift, and the customer never sees a reason the product did not
 * intend. "Other" carries the detail in the free-text notes.
 */
export const REJECTION_REASONS = [
  "Payment not received",
  "Incorrect amount",
  "Receipt cannot be verified",
  "Duplicate receipt",
  "Other",
] as const;

export type RejectionReason = (typeof REJECTION_REASONS)[number];

export function isRejectionReason(v: unknown): v is RejectionReason {
  return typeof v === "string" && (REJECTION_REASONS as readonly string[]).includes(v);
}

/** Whether an admin may confirm or reject — only a submitted receipt qualifies. */
export function canReviewPayment(status: string): boolean {
  return status === "PAYMENT_SUBMITTED";
}

export type ReceiptCheck =
  | { ok: true; mime: ReceiptMime; extension: string }
  | { ok: false; error: string };

/**
 * Validate an upload by its declared type and size.
 *
 * The caller must pass the type from the file's own bytes or the multipart
 * part, not from the extension: a renamed `.jpg` executable would otherwise
 * pass. Size is checked here so both the route and the form can use one rule.
 */
export function validateReceipt(mime: unknown, size: unknown): ReceiptCheck {
  const type = typeof mime === "string" ? mime.toLowerCase().split(";")[0].trim() : "";
  if (!RECEIPT_MIME_TYPES.includes(type as ReceiptMime)) {
    return { ok: false, error: "Please upload a JPG, PNG, WEBP or PDF." };
  }
  const bytes = typeof size === "number" ? size : NaN;
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return { ok: false, error: "That file appears to be empty." };
  }
  if (bytes > RECEIPT_MAX_BYTES) {
    return { ok: false, error: "That file is larger than 5 MB." };
  }
  const m = type as ReceiptMime;
  return { ok: true, mime: m, extension: EXTENSION[m] };
}

/**
 * Storage key for a receipt: `payments/SB-1048/<random>.jpg`.
 *
 * Namespaced by order so an admin can find everything for one order, but the
 * filename itself is random — the customer's own filename is discarded, and a
 * key must not be guessable from the order number alone.
 */
export function receiptKey(orderNumber: string, extension: string, random: string): string {
  const safeOrder = orderNumber.replace(/[^A-Za-z0-9_-]/g, "");
  return `payments/${safeOrder}/${random}.${extension}`;
}

/** "4h 32m", or "Expired" once the deadline has passed. */
export function timeRemaining(expiresAt: Date | null, now: Date = new Date()): string {
  if (!expiresAt) return "—";
  const ms = expiresAt.getTime() - now.getTime();
  if (ms <= 0) return "Expired";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** Customer-facing wording for each payment state. */
export const PAYMENT_STATUS_LABEL: Record<BankPaymentStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  PAYMENT_SUBMITTED: "Payment submitted",
  PAID: "Paid",
  REJECTED: "Payment rejected",
  EXPIRED: "Expired",
};
