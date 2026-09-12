/**
 * How a customer is labelled on the admin Orders and Returns screens.
 *
 * Split out of queries/admin.ts because the fallback chain there was subtly
 * broken and repeated twice:
 *
 *     user.name ?? [firstName, lastName].filter(Boolean).join(" ") ?? user.email
 *
 * `[].join(" ")` returns `""`, never null or undefined, so `??` treated the
 * empty string as a real answer and the email fallback was unreachable. Every
 * seeded and registered user has a name, so nothing showed it — until account
 * deletion started anonymizing users, whose names are all null by design.
 */

const DELETED_LABEL = "Deleted account";

export type CustomerNameInput = {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email?: string | null;
};

/**
 * A non-empty label for an order's customer.
 *
 * An anonymized user is named as such rather than shown by their
 * `@deleted.invalid` address: the address is machine noise, and "Deleted
 * account" answers the question an admin looking at a blank row actually has.
 */
export function customerName(user: CustomerNameInput): string {
  const full = user.name?.trim();
  if (full) return full;

  const parts = [user.firstName, user.lastName]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));
  if (parts.length > 0) return parts.join(" ");

  const email = user.email?.trim();
  if (email && !email.endsWith("@deleted.invalid")) return email;

  return DELETED_LABEL;
}
