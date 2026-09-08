// Per-size stock for a product — validation, SKU derivation, and the product
// total. Pure: no I/O and no server-only imports, so the admin form and the API
// route share one implementation and it is unit-testable.
//
// A "size" is one ProductVariant row: the axis label lives on the product (all
// its variants share it — "Length", "Gauge", "Diameter"), while the value and
// the quantity in stock at that value live per row.
//
// The product's own `inventory` is DERIVED from these rows whenever a product
// has any: it is their sum. Both numbers are live in checkout — an order line
// with a variantId decrements the variant, one without decrements the product
// — so leaving them independently editable is how a shop oversells.

export const SIZE_LABEL_MAX = 24;
export const SIZE_VALUE_MAX = 24;
/** Bounds the request payload and the modal; far above any real product. */
export const SIZES_MAX = 24;
export const SIZE_QUANTITY_MAX = 100_000;

/** The default axis when an admin adds sizes without naming one. */
export const DEFAULT_SIZE_LABEL = "Length";

export type SizeRow = {
  /** Existing ProductVariant id, or null/absent for a row being added. */
  id: string | null;
  value: string;
  quantity: number;
  /** Price added on top of the product price, or null for none. */
  additionalPrice: number | null;
};

export type SizesCheck =
  | { ok: true; label: string | null; sizes: SizeRow[] }
  | { ok: false; error: string };

function num(v: unknown): number {
  return typeof v === "number" ? v : NaN;
}

/**
 * Validate and normalise the size rows from a request or form.
 *
 * An empty list is valid and means "this product has no sizes" — aftercare and
 * merch legitimately have none, which is why the seed only gives variants to
 * physical jewelry types.
 */
export function validateSizes(rawLabel: unknown, rawSizes: unknown): SizesCheck {
  if (rawSizes !== undefined && rawSizes !== null && !Array.isArray(rawSizes)) {
    return { ok: false, error: "Sizes must be a list." };
  }
  const list = Array.isArray(rawSizes) ? rawSizes : [];

  if (list.length > SIZES_MAX) {
    return { ok: false, error: `A product can have at most ${SIZES_MAX} sizes.` };
  }

  const label = typeof rawLabel === "string" ? rawLabel.trim() : "";
  if (label.length > SIZE_LABEL_MAX) {
    return { ok: false, error: `The size label must be ${SIZE_LABEL_MAX} characters or fewer.` };
  }

  const sizes: SizeRow[] = [];
  const seen = new Set<string>();

  for (const entry of list) {
    const e = (entry ?? {}) as Record<string, unknown>;

    const value = typeof e.value === "string" ? e.value.trim() : "";
    // A blank row is dropped rather than rejected: the modal starts a new row
    // empty, and an admin who adds one and changes their mind should not have
    // to delete it before saving.
    if (!value) continue;
    if (value.length > SIZE_VALUE_MAX) {
      return { ok: false, error: `“${value}” is too long — ${SIZE_VALUE_MAX} characters or fewer.` };
    }

    const key = value.toLowerCase();
    if (seen.has(key)) {
      return { ok: false, error: `“${value}” is listed twice. Each size can only appear once.` };
    }
    seen.add(key);

    const quantity = num(e.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      return { ok: false, error: `The quantity for “${value}” must be a whole number of 0 or more.` };
    }
    if (quantity > SIZE_QUANTITY_MAX) {
      return { ok: false, error: `The quantity for “${value}” is unrealistically large.` };
    }

    let additionalPrice: number | null = null;
    if (e.additionalPrice !== null && e.additionalPrice !== undefined && e.additionalPrice !== "") {
      const p = num(e.additionalPrice);
      if (!Number.isFinite(p) || p < 0) {
        return { ok: false, error: `The extra price for “${value}” must be 0 or more.` };
      }
      additionalPrice = Number(p.toFixed(2));
    }

    sizes.push({
      id: typeof e.id === "string" && e.id ? e.id : null,
      value,
      quantity,
      additionalPrice,
    });
  }

  // The label only means anything alongside rows, and rows need one to read as
  // anything ("8mm" of what?), so it is defaulted rather than demanded.
  if (sizes.length === 0) return { ok: true, label: null, sizes: [] };
  return { ok: true, label: label || DEFAULT_SIZE_LABEL, sizes };
}

/**
 * The product's stock: the sum of its sizes, or `fallback` when it has none.
 *
 * `fallback` is the hand-entered figure from the form, which stays meaningful
 * for a product without sizes.
 */
export function stockFromSizes(sizes: SizeRow[], fallback: number): number {
  if (sizes.length === 0) return fallback;
  return sizes.reduce((total, s) => total + s.quantity, 0);
}

/**
 * A variant SKU derived from the product's own: `SB-ROSEGOLD14` + `8mm` →
 * `SB-ROSEGOLD14-8MM`.
 *
 * ProductVariant.sku is globally unique, and product SKUs already are, so
 * product SKU + a de-duplicated value cannot collide within or across products.
 * Derived rather than collected because it is one more required field per row
 * an admin would have to invent, and the seed's `V-{cuid}-…` form is not
 * something anyone would want to print.
 */
export function variantSku(productSku: string, value: string): string {
  const part = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${productSku.toUpperCase()}-${part || "SIZE"}`;
}

/** "Length: 6mm ×4, 8mm ×12, 10mm ×0" — for an audit summary. */
export function sizesSummary(label: string | null, sizes: SizeRow[]): string {
  if (sizes.length === 0) return "no sizes";
  const body = sizes.map((s) => `${s.value} ×${s.quantity}`).join(", ");
  return `${label ?? DEFAULT_SIZE_LABEL}: ${body}`;
}
