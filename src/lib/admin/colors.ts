// A product's colours — validation. Pure, like sizes.ts, so the admin form and
// the API route share it.
//
// Each colour carries the photo the PDP gallery jumps to when it is picked,
// and an optional extra price that is folded into its stock lines on save.

export const COLOR_NAME_MAX = 24;
/** Bounds the request payload and the modal; far above any real product. */
export const COLORS_MAX = 12;

const SWATCH_RE = /^#[0-9a-f]{6}$/i;
const IMAGE_URL_RE = /^https?:\/\/\S+$/i;

export type ColorRow = {
  /** Existing ProductColor id, or null for a colour being added. */
  id: string | null;
  name: string;
  /** "#c9a96e", or null to show the photo as the swatch. */
  swatch: string | null;
  imageUrl: string;
  /** Price added on top of the product price, or null for none. */
  additionalPrice: number | null;
};

export type ColorsCheck = { ok: true; colors: ColorRow[] } | { ok: false; error: string };

/**
 * Validate and normalise the colour rows from a request or form.
 *
 * An empty list is valid and means "this product comes in one colour". A row
 * with no name is dropped, as with sizes, so an untouched new row is harmless.
 */
export function validateColors(rawColors: unknown): ColorsCheck {
  if (rawColors !== undefined && rawColors !== null && !Array.isArray(rawColors)) {
    return { ok: false, error: "Colours must be a list." };
  }
  const list = Array.isArray(rawColors) ? rawColors : [];

  if (list.length > COLORS_MAX) {
    return { ok: false, error: `A product can have at most ${COLORS_MAX} colours.` };
  }

  const colors: ColorRow[] = [];
  const seen = new Set<string>();

  for (const entry of list) {
    const e = (entry ?? {}) as Record<string, unknown>;

    const name = typeof e.name === "string" ? e.name.trim() : "";
    if (!name) continue;
    if (name.length > COLOR_NAME_MAX) {
      return { ok: false, error: `“${name}” is too long: ${COLOR_NAME_MAX} characters or fewer.` };
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      return { ok: false, error: `“${name}” is listed twice. Each colour can only appear once.` };
    }
    seen.add(key);

    const swatch = typeof e.swatch === "string" ? e.swatch.trim() : "";
    if (swatch && !SWATCH_RE.test(swatch)) {
      return { ok: false, error: `The swatch for “${name}” must be a hex colour like #c9a96e.` };
    }

    // Required: picking a colour jumps the gallery to its photo, and a colour
    // with nothing to jump to would leave the shopper looking at another one.
    const imageUrl = typeof e.imageUrl === "string" ? e.imageUrl.trim() : "";
    if (!imageUrl) return { ok: false, error: `Add a photo for “${name}”.` };
    if (!IMAGE_URL_RE.test(imageUrl)) {
      return { ok: false, error: `The photo for “${name}” must be a web address (https://…).` };
    }

    let additionalPrice: number | null = null;
    if (e.additionalPrice !== null && e.additionalPrice !== undefined && e.additionalPrice !== "") {
      const p = typeof e.additionalPrice === "number" ? e.additionalPrice : NaN;
      if (!Number.isFinite(p) || p < 0) {
        return { ok: false, error: `The extra price for “${name}” must be 0 or more.` };
      }
      additionalPrice = Number(p.toFixed(2));
    }

    colors.push({
      id: typeof e.id === "string" && e.id ? e.id : null,
      name,
      swatch: swatch ? swatch.toLowerCase() : null,
      imageUrl,
      additionalPrice,
    });
  }

  return { ok: true, colors };
}

/**
 * "Gold (#c9a96e, gold.webp, +$10.00); Silver (silver.webp)" — for an audit
 * summary, so a changed swatch, photo or extra price is logged. The photo is
 * shown by file name: the full URL is long and its host never changes.
 */
export function colorsSummary(
  colors: { name: string; swatch: string | null; imageUrl: string; additionalPrice: number | null }[],
): string {
  if (colors.length === 0) return "no colours";
  return colors
    .map((c) => {
      const parts = [
        c.swatch,
        c.imageUrl.split("/").pop() || c.imageUrl,
        c.additionalPrice ? `+$${c.additionalPrice.toFixed(2)}` : null,
      ].filter(Boolean);
      return `${c.name} (${parts.join(", ")})`;
    })
    .join("; ");
}
