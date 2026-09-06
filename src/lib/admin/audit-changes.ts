// Pure half of the admin audit log: action names, field diffing, and reading
// the client IP. No Prisma and no server-only import, so it is unit-testable
// and safe to pull into any bundle — matching how contact/validate.ts and
// newsletter/validate.ts are split. The database side lives in ./audit.

/** Every auditable verb. Strings, so filtering the Activity screen is trivial. */
export const AUDIT_ACTIONS = {
  productCreate: "product.create",
  productUpdate: "product.update",
  inventoryUpdate: "inventory.update",
  categoryCreate: "category.create",
  categoryUpdate: "category.update",
  categoryDelete: "category.delete",
  orderStatusChange: "order.status_change",
  returnStatusChange: "return.status_change",
  imageUpload: "image.upload",
  promoCreate: "promo.create",
  promoUpdate: "promo.update",
  promoDelete: "promo.delete",
  subscriberCreate: "subscriber.create",
  subscriberUpdate: "subscriber.update",
  subscriberDelete: "subscriber.delete",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/** How long rows are kept. Owner's decision, 2026-09-05. */
export const AUDIT_RETENTION_MONTHS = 12;

export type FieldChange = { from: unknown; to: unknown };
export type ChangeSet = Record<string, FieldChange>;

/**
 * Fields that differ between two versions of a record.
 *
 * Compared with Object.is after normalising Decimal/Date to primitives, so a
 * Prisma Decimal of 45 and the number 45 do not read as a change — otherwise
 * every save would look like it edited every price and the log would be noise.
 *
 * A field absent from `after` means "not touched" and is skipped; only an
 * explicit null counts as clearing it.
 */
export function diffFields<B extends Record<string, unknown>>(
  before: B,
  // Intentionally not `Partial<B>`: `before` comes from Prisma and carries
  // Decimal/Date, while `after` is the plain JS the route parsed from the
  // request. normalise() reconciles them, so the types only need to agree on
  // the field NAMES — which `fields` still checks against `before`.
  after: Record<string, unknown>,
  fields: (keyof B & string)[],
): ChangeSet {
  const changes: ChangeSet = {};
  for (const field of fields) {
    if (!(field in after)) continue;
    const from = normalise(before[field]);
    const to = normalise(after[field]);
    if (!Object.is(from, to)) changes[field] = { from, to };
  }
  return changes;
}

function normalise(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  // Prisma Decimal, which exposes toNumber().
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    return (v as { toNumber: () => number }).toNumber();
  }
  return v;
}

/** True when a diff found nothing — callers skip logging a no-op save. */
export function hasChanges(changes: ChangeSet): boolean {
  return Object.keys(changes).length > 0;
}

/**
 * Best-effort client IP from proxy headers.
 *
 * Returns null rather than the rate limiter's "127.0.0.1" placeholder when no
 * header is present: recording a loopback address in an audit trail would be
 * stating something untrue about where a change came from.
 */
export function auditIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || null;
  return request.headers.get("x-real-ip")?.trim() || null;
}
