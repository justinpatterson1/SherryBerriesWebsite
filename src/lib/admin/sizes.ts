// A product's sizes — validation of the size axis. Pure: no I/O and no
// server-only imports, so the admin form and the API route share one
// implementation and it is unit-testable.
//
// A size is one value on the product's size axis. The axis label lives on the
// product (all its variants share it — "Length", "Gauge", "Diameter"). Stock is
// not held per size but per stock line, which is a size, a colour, or a colour
// × size combination: see variants.ts.

export const SIZE_LABEL_MAX = 24;
export const SIZE_VALUE_MAX = 24;
/** Bounds the request payload and the modal; far above any real product. */
export const SIZES_MAX = 24;

/** The default axis when an admin adds sizes without naming one. */
export const DEFAULT_SIZE_LABEL = "Length";

export type SizeRow = {
  /**
   * The value this size was loaded with, or null for a size being added.
   * Lets a rename keep its stock lines (and the orders on them) rather than
   * reading as one size removed and another added.
   */
  previous: string | null;
  value: string;
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
      return { ok: false, error: `“${value}” is too long: ${SIZE_VALUE_MAX} characters or fewer.` };
    }

    const key = value.toLowerCase();
    if (seen.has(key)) {
      return { ok: false, error: `“${value}” is listed twice. Each size can only appear once.` };
    }
    seen.add(key);

    let additionalPrice: number | null = null;
    if (e.additionalPrice !== null && e.additionalPrice !== undefined && e.additionalPrice !== "") {
      const p = num(e.additionalPrice);
      if (!Number.isFinite(p) || p < 0) {
        return { ok: false, error: `The extra price for “${value}” must be 0 or more.` };
      }
      additionalPrice = Number(p.toFixed(2));
    }

    sizes.push({
      previous: typeof e.previous === "string" && e.previous.trim() ? e.previous.trim() : null,
      value,
      additionalPrice,
    });
  }

  // The label only means anything alongside rows, and rows need one to read as
  // anything ("8mm" of what?), so it is defaulted rather than demanded.
  if (sizes.length === 0) return { ok: true, label: null, sizes: [] };
  return { ok: true, label: label || DEFAULT_SIZE_LABEL, sizes };
}
