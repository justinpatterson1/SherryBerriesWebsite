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
