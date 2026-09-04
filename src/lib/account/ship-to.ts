// Resolving the address an order shipped to. Pure — no I/O, no server-only
// imports — so the fallback logic can be unit-tested without a database.

export type OrderShipTo = {
  name: string | null;
  phone: string | null;
  email: string | null;
  line1: string | null;
  city: string | null;
  landmark: string | null;
};

/** The subset of an Order row this needs: snapshot columns + legacy notes. */
export type ShipToSource = {
  shipName: string | null;
  shipPhone: string | null;
  shipEmail: string | null;
  shipLine1: string | null;
  shipCity: string | null;
  shipLandmark: string | null;
  notes: string | null;
};

/**
 * Where an order shipped.
 *
 * Prefers the snapshot columns written at checkout. Falls back to parsing the
 * JSON the checkout used to stuff into `notes`, for orders placed before those
 * columns existed whose blob the migration's backfill could not read.
 *
 * Returns null rather than borrowing the customer's current address. Showing
 * today's default address as the ship-to for a two-year-old order is precisely
 * the bug this replaced, so "unknown" has to be representable.
 */
export function resolveShipTo(o: ShipToSource): OrderShipTo | null {
  if (o.shipLine1 || o.shipName) {
    return {
      name: o.shipName,
      phone: o.shipPhone,
      email: o.shipEmail,
      line1: o.shipLine1,
      city: o.shipCity,
      landmark: o.shipLandmark,
    };
  }

  if (!o.notes) return null;
  try {
    const parsed = JSON.parse(o.notes) as {
      contact?: { firstName?: string; lastName?: string; phone?: string; email?: string };
      address?: { line1?: string; city?: string; landmark?: string | null };
    };
    if (!parsed?.address?.line1) return null;
    const name = [parsed.contact?.firstName, parsed.contact?.lastName]
      .filter(Boolean)
      .join(" ");
    return {
      name: name || null,
      phone: parsed.contact?.phone ?? null,
      email: parsed.contact?.email ?? null,
      line1: parsed.address.line1 ?? null,
      city: parsed.address.city ?? null,
      landmark: parsed.address.landmark ?? null,
    };
  } catch {
    // Seeded orders put a plain sentence in `notes`; that is not an address.
    return null;
  }
}
