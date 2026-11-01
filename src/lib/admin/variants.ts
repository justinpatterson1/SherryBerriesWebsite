// A product's stock lines — one ProductVariant per colour × size combination,
// per colour, or per size, depending on which axes the product has. Pure, like
// sizes.ts and colors.ts, so the form and the API route share it.
//
// Each line stores a display label in `value` ("Gold · 8mm", "Gold", "8mm")
// and its total extra price in `additionalPrice` (size extra + colour extra).
// Cart, checkout, orders and emails read only those, so they need no idea
// colours exist.
//
// The product's own `inventory` is DERIVED from these lines whenever it has
// any: it is their sum. Both numbers are live in checkout — an order line with
// a variantId decrements the variant, one without decrements the product — so
// leaving them independently editable is how a shop oversells.

import { validateColors, type ColorRow } from "./colors";
import { validateSizes, type SizeRow } from "./sizes";

export const VARIANT_QUANTITY_MAX = 100_000;

/** Between colour and size in a stock line's label: "Gold · 8mm". */
export const LABEL_SEPARATOR = " · ";

export type VariantRow = {
  /** Index into the colours list, or null when the product has none. */
  colorIndex: number | null;
  size: string | null;
  /** The display label, stored as ProductVariant.value. */
  value: string;
  quantity: number;
  /** Size extra + colour extra, or null when neither has one. */
  additionalPrice: number | null;
};

export type VariantsCheck =
  | {
      ok: true;
      /** The size axis label. Null when the product has no sizes. */
      label: string | null;
      sizes: SizeRow[];
      colors: ColorRow[];
      variants: VariantRow[];
    }
  | { ok: false; error: string };

/** "Gold · 8mm", "Gold" or "8mm". */
export function variantLabel(color: string | null, size: string | null): string {
  return [color, size].filter(Boolean).join(LABEL_SEPARATOR);
}

/** Matches a stock entry to its combination; names are unique case-insensitively. */
function comboKey(color: string | null, size: string | null): string {
  return `${(color ?? "").toLowerCase()}|${(size ?? "").toLowerCase()}`;
}

function addPrices(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return Number(((a ?? 0) + (b ?? 0)).toFixed(2));
}

/**
 * Validate the size axis, the colours and the stock for each combination, and
 * expand them into stock lines.
 *
 * `stock` is a list of `{ color, size, quantity }` naming each line by colour
 * name and size value (either null when the product lacks that axis). A
 * combination with no entry has 0 in stock; an entry naming no combination is
 * ignored, which is what a blank row dropped by validation leaves behind.
 */
export function validateVariants(input: {
  sizeLabel: unknown;
  sizes: unknown;
  colors: unknown;
  stock: unknown;
}): VariantsCheck {
  const sized = validateSizes(input.sizeLabel, input.sizes);
  if (!sized.ok) return sized;
  const colored = validateColors(input.colors);
  if (!colored.ok) return colored;

  if (input.stock !== undefined && input.stock !== null && !Array.isArray(input.stock)) {
    return { ok: false, error: "Stock must be a list." };
  }

  const { sizes } = sized;
  const { colors } = colored;
  if (sizes.length === 0 && colors.length === 0) {
    return { ok: true, label: null, sizes, colors, variants: [] };
  }

  const quantities = new Map<string, unknown>();
  for (const entry of Array.isArray(input.stock) ? input.stock : []) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const color = typeof e.color === "string" ? e.color.trim() : null;
    const size = typeof e.size === "string" ? e.size.trim() : null;
    quantities.set(comboKey(color || null, size || null), e.quantity);
  }

  const colorAxis: (number | null)[] = colors.length > 0 ? colors.map((_, i) => i) : [null];
  const sizeAxis: (SizeRow | null)[] = sizes.length > 0 ? sizes : [null];

  const variants: VariantRow[] = [];
  for (const ci of colorAxis) {
    const color = ci === null ? null : colors[ci];
    for (const size of sizeAxis) {
      const value = variantLabel(color?.name ?? null, size?.value ?? null);
      const raw = quantities.get(comboKey(color?.name ?? null, size?.value ?? null)) ?? 0;
      const quantity = typeof raw === "number" ? raw : NaN;
      if (!Number.isInteger(quantity) || quantity < 0) {
        return { ok: false, error: `The quantity for “${value}” must be a whole number of 0 or more.` };
      }
      if (quantity > VARIANT_QUANTITY_MAX) {
        return { ok: false, error: `The quantity for “${value}” is unrealistically large.` };
      }
      variants.push({
        colorIndex: ci,
        size: size?.value ?? null,
        value,
        quantity,
        additionalPrice: addPrices(size?.additionalPrice ?? null, color?.additionalPrice ?? null),
      });
    }
  }

  return { ok: true, label: sized.label, sizes, colors, variants };
}

/**
 * The product's stock: the sum of its lines, or `fallback` when it has none.
 *
 * `fallback` is the hand-entered figure from the form, which stays meaningful
 * for a product without sizes or colours.
 */
export function stockFromVariants(variants: { quantity: number }[], fallback: number): number {
  if (variants.length === 0) return fallback;
  return variants.reduce((total, v) => total + v.quantity, 0);
}

/**
 * A variant SKU derived from the product's own: `SB-LABRET` + `Gold`, `8mm` →
 * `SB-LABRET-GOLD-8MM`.
 *
 * ProductVariant.sku is globally unique, and product SKUs already are, so
 * product SKU + a de-duplicated combination cannot collide within a product.
 * Derived rather than collected because it is one more required field per row
 * an admin would have to invent, and the seed's `V-{cuid}-…` form is not
 * something anyone would want to print.
 */
export function variantSku(productSku: string, parts: (string | null)[]): string {
  const part = parts
    .filter(Boolean)
    .join("-")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${productSku.toUpperCase()}-${part || "SIZE"}`;
}

/**
 * "Length: Gold · 6mm ×4, Gold · 8mm ×12 +$5.00" — for an audit summary. The
 * extra price is included so a price change on a size or colour is logged,
 * not just a stock change.
 */
export function variantsSummary(
  label: string | null,
  variants: { value: string; quantity: number; additionalPrice: number | null }[],
): string {
  if (variants.length === 0) return "no sizes or colours";
  const body = variants
    .map((v) => `${v.value} ×${v.quantity}${v.additionalPrice ? ` +$${v.additionalPrice.toFixed(2)}` : ""}`)
    .join(", ");
  return label ? `${label}: ${body}` : body;
}

export type ExistingVariant = {
  id: string;
  colorId: string | null;
  size: string | null;
  value: string;
};

/**
 * Pair each new stock line with the existing variant it takes over, so stock
 * history and the orders pointing at a row survive the edit.
 *
 * A variant follows its colour by id and its size through a rename (via
 * `SizeRow.previous`). When the product gains an axis it lacked, its existing
 * lines move to the first value of that axis — a sized piece that gains
 * colours keeps its sizes, under the first colour — rather than being deleted,
 * which would be refused for anything already ordered. When it loses an axis,
 * the first line to land on each remaining combination keeps it.
 *
 * `colorIds` lines up with the colours list, each one already saved. Returns
 * the existing id for each new line (null to create one) and the variants
 * nothing took over.
 */
export function matchVariants(
  existing: ExistingVariant[],
  variants: VariantRow[],
  colorIds: string[],
  sizes: SizeRow[],
): { ids: (string | null)[]; removed: ExistingVariant[] } {
  const key = (colorId: string | null, size: string | null) =>
    `${colorId ?? ""}|${(size ?? "").toLowerCase()}`;

  const wanted = new Map<string, number>();
  variants.forEach((v, i) => {
    wanted.set(key(v.colorIndex === null ? null : colorIds[v.colorIndex], v.size), i);
  });

  const sizeFor = (size: string | null): string | null | undefined => {
    if (sizes.length === 0) return null;
    if (size === null) return sizes[0].value;
    const lower = size.toLowerCase();
    const match =
      sizes.find((s) => s.previous?.toLowerCase() === lower) ??
      sizes.find((s) => s.previous === null && s.value.toLowerCase() === lower);
    return match?.value;
  };

  const colorFor = (colorId: string | null): string | null | undefined => {
    if (colorIds.length === 0) return null;
    if (colorId === null) return colorIds[0];
    return colorIds.includes(colorId) ? colorId : undefined;
  };

  const ids: (string | null)[] = variants.map(() => null);
  const removed: ExistingVariant[] = [];

  for (const e of existing) {
    const color = colorFor(e.colorId);
    const size = sizeFor(e.size);
    const index = color === undefined || size === undefined ? undefined : wanted.get(key(color, size));
    if (index === undefined || ids[index] !== null) {
      removed.push(e);
    } else {
      ids[index] = e.id;
    }
  }

  return { ids, removed };
}
