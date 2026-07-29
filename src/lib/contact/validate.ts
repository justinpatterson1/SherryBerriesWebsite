// Pure validation for the contact form, shared by the client form and the API
// route. No I/O and no server-only imports, so it's safe on both sides and
// trivially unit-testable.

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export const CONTACT_LIMITS = {
  nameMax: 100,
  subjectMax: 150,
  messageMin: 10,
  messageMax: 5000,
} as const;

// Deliberately permissive — a full RFC check is overkill; we just reject
// obviously-malformed addresses. The real proof of a valid inbox is delivery.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactCheck =
  | { ok: true; data: ContactInput }
  | { ok: false; error: string };

export function validateContact(raw: {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
}): ContactCheck {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = str(raw.name);
  const email = str(raw.email);
  const subject = str(raw.subject);
  const message = str(raw.message);

  if (!name) return { ok: false, error: "Please enter your name." };
  if (name.length > CONTACT_LIMITS.nameMax) {
    return { ok: false, error: "That name is too long." };
  }

  if (!email) return { ok: false, error: "Please enter your email." };
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (subject.length > CONTACT_LIMITS.subjectMax) {
    return { ok: false, error: "That subject is too long." };
  }

  if (!message) return { ok: false, error: "Please enter a message." };
  if (message.length < CONTACT_LIMITS.messageMin) {
    return { ok: false, error: "Your message is a little short — tell us a bit more." };
  }
  if (message.length > CONTACT_LIMITS.messageMax) {
    return { ok: false, error: "Your message is too long." };
  }

  return { ok: true, data: { name, email, subject, message } };
}
