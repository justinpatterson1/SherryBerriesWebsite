/**
 * Self-service account deletion — the data rules, separate from the route.
 *
 * The route ([api/account/delete](../../app/api/account/delete/route.ts)) owns
 * auth, re-authentication and the transaction; everything here is pure so it
 * can be tested, because this project tests `lib/` and `actions/` only.
 *
 * ## Why the user row survives
 *
 * `Order.userId` is a required relation declared with no `onDelete`
 * (schema.prisma), which Postgres treats as RESTRICT. `prisma.user.delete()`
 * therefore throws a foreign-key error for any customer who has ever placed an
 * order. Rather than making orders parentless, the row is kept and stripped of
 * everything that identifies a person — which is also what the Privacy Policy
 * promises: "we will remove or anonymize your personal information where
 * legally permitted. Certain records may be retained where required by law."
 */

/**
 * The anonymized address written over `User.email`.
 *
 * `email` is `@unique`, so it cannot be nulled or set to a shared constant —
 * the second deletion would collide with the first. The user id is already
 * unique, so it makes the local part unique for free.
 *
 * `.invalid` is reserved by RFC 2606 and guaranteed never to resolve, so this
 * address cannot be mailed even by accident. That matters: a deleted account
 * must not receive a marketing send.
 */
export function anonymizedEmail(userId: string): string {
  return `deleted-${userId}@deleted.invalid`;
}

/** True for an address produced by {@link anonymizedEmail}. */
export function isAnonymizedEmail(email: string): boolean {
  return email.endsWith("@deleted.invalid");
}

/**
 * The scrubbed `User` columns. `password` and `emailVerified` are cleared so
 * the row cannot authenticate by any route: with no password the credentials
 * provider has nothing to compare, and the route deletes the `Account` rows
 * that back OAuth sign-in.
 */
export function anonymizedUserFields(userId: string, now: Date) {
  return {
    email: anonymizedEmail(userId),
    firstName: null,
    lastName: null,
    name: null,
    phoneNumber: null,
    image: null,
    avatarUrl: null,
    password: null,
    emailVerified: null,
    deletedAt: now,
  };
}

/**
 * The scrubbed `Order` delivery snapshot.
 *
 * `shipCity` is deliberately kept. Clearing the whole snapshot would destroy
 * the record of where the goods actually went, which is the evidence in a
 * delivery dispute — and a city on its own does not identify the person once
 * the name, phone, email and street line are gone.
 */
export function scrubbedOrderShipping() {
  return {
    shipName: null,
    shipPhone: null,
    shipEmail: null,
    shipLine1: null,
    shipLandmark: null,
    // shipCity: kept on purpose — see above.
  };
}

type OrderNotes = {
  contact?: { firstName?: unknown; lastName?: unknown; email?: unknown; phone?: unknown };
  address?: { line1?: unknown; city?: unknown; landmark?: unknown };
  [key: string]: unknown;
};

/**
 * Scrub the personal data out of `Order.notes`, preserving everything else.
 *
 * ⚠ The order PII lives in **two** places. `api/checkout/route.ts` writes the
 * `ship*` columns *and* a full JSON copy of the customer into `notes`
 * (`{ contact: { firstName, lastName, email, phone }, address: {...} }`) — its
 * "Order has no address columns" comment predates those columns. Scrubbing only
 * the columns would leave an intact second copy of the customer here.
 *
 * The JSON must stay parseable rather than being blanked: the account order
 * view falls back to `notes` for orders placed before the `ship*` columns
 * existed, and non-personal keys (`shipping`, `payment`, `promo`) are still
 * read from it. So the personal keys are emptied in place and the rest is left
 * exactly as it was.
 *
 * Returns the input unchanged when it is not the JSON shape this writes —
 * a null, a free-text admin note, or anything unparseable is not ours to edit.
 */
export function scrubOrderNotes(notes: string | null): string | null {
  if (!notes) return notes;

  let parsed: unknown;
  try {
    parsed = JSON.parse(notes);
  } catch {
    return notes;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return notes;
  }

  const data = parsed as OrderNotes;
  if (!("contact" in data) && !("address" in data)) return notes;

  const scrubbed: OrderNotes = { ...data };
  if (data.contact) {
    scrubbed.contact = { firstName: null, lastName: null, email: null, phone: null };
  }
  if (data.address) {
    // Mirrors scrubbedOrderShipping(): the city stays, the street does not.
    scrubbed.address = {
      line1: null,
      city: data.address.city ?? null,
      landmark: null,
    };
  }
  return JSON.stringify(scrubbed);
}

export type DeletionBlock = { blocked: true; reason: string } | { blocked: false };

/**
 * Refuse deletions that would lock the business out of its own store.
 *
 * A SUPERADMIN is the only role that can view the audit log and manage other
 * admins. If the last one anonymizes themselves there is no supported way back
 * in — the fix would be a manual database edit in the Neon console.
 */
export function checkDeletionAllowed(
  role: string,
  otherSuperadminCount: number,
): DeletionBlock {
  if (role === "SUPERADMIN" && otherSuperadminCount === 0) {
    return {
      blocked: true,
      reason:
        "This is the only superadmin account. Promote another superadmin before deleting this one.",
    };
  }
  return { blocked: false };
}
