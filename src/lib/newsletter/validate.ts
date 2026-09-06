// Pure validation + normalisation for the newsletter signup, shared by the
// client form and the API route. No I/O and no server-only imports, so it is
// safe on both sides and trivially unit-testable.

export const EMAIL_MAX = 254; // RFC 5321 upper bound on a full address.

// Deliberately permissive — matches lib/contact/validate.ts. A full RFC check
// is overkill; the real proof of a valid inbox is delivery.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewsletterCheck =
  | { ok: true; email: string }
  | { ok: false; error: string };

/**
 * Normalise an address for storage and comparison: trimmed and lowercased.
 *
 * Case-folding the local part is technically lossy — RFC 5321 lets it be
 * case-sensitive — but no mail provider anyone uses treats it that way, and
 * folding is what stops "Sam@x.com" and "sam@x.com" becoming two rows that
 * both receive the same newsletter.
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateNewsletterEmail(raw: unknown): NewsletterCheck {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return { ok: false, error: "Please enter your email." };
  if (value.length > EMAIL_MAX) return { ok: false, error: "That email is too long." };
  if (!EMAIL_RE.test(value)) return { ok: false, error: "Please enter a valid email." };
  return { ok: true, email: normalizeEmail(value) };
}

/**
 * `sam@example.com` → `s***@example.com`.
 *
 * Used when an admin action on a subscriber is written to the audit log. The
 * log deliberately holds no customer personal data, but an entry reading only
 * "deleted subscriber cmf3x…" is unreadable once the row it points at is gone.
 * Masking keeps the entry recognisable to someone who already knows the address
 * without turning the audit table into a second copy of the mailing list.
 *
 * A single-character local part is dropped entirely rather than exposed.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return `${local.length > 1 ? local[0] : ""}***@${domain}`;
}
