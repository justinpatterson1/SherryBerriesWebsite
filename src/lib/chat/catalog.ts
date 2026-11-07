// Pure catalog filtering for the shopping assistant's search tool. The rows are
// loaded by tools.ts; everything here is plain data in, plain data out, so the
// matching rules can be tested without a database.

export interface CatalogProduct {
  slug: string;
  name: string;
  shortDescription: string;
  categoryName: string;
  categorySlug: string;
  material: string | null;
  tags: string[];
  colors: string[];
  sizes: string[];
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  inventory: number;
  variantInventory: number[];
  isPreorder: boolean;
  isDigital: boolean;
}

/** What the chat widget renders as a product card. */
export interface ChatProductCard {
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  isPreorder: boolean;
}

export interface SearchFilters {
  query: string | null;
  category: string | null;
  material: string | null;
  color: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  includeOutOfStock: boolean;
}

export const MAX_SEARCH_RESULTS = 6;

/**
 * Same rule as the product page's buy box: downloads and preorders hold no
 * stock and are always buyable; otherwise any variant in stock (or, with no
 * variants, the product's own count) makes it available.
 */
export function isAvailable(p: CatalogProduct): boolean {
  if (p.isDigital || p.isPreorder) return true;
  if (p.variantInventory.length > 0) return p.variantInventory.some((n) => n > 0);
  return p.inventory > 0;
}

const includes = (haystack: string | null | undefined, needle: string) =>
  !!haystack && haystack.toLowerCase().includes(needle);

function words(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1);
}

/** How well a product matches the free-text query: matched words, name hits weighted up. */
function queryScore(p: CatalogProduct, q: string): number {
  let score = 0;
  for (const w of words(q)) {
    if (includes(p.name, w)) score += 3;
    else if (includes(p.categoryName, w)) score += 2;
    else if (
      includes(p.material, w) ||
      p.tags.some((t) => includes(t, w)) ||
      p.colors.some((c) => includes(c, w)) ||
      includes(p.shortDescription, w)
    )
      score += 1;
  }
  return score;
}

export function filterCatalog(
  catalog: CatalogProduct[],
  f: SearchFilters,
): CatalogProduct[] {
  const category = f.category?.trim().toLowerCase() || null;
  const material = f.material?.trim().toLowerCase() || null;
  const color = f.color?.trim().toLowerCase() || null;
  const query = f.query?.trim() || null;

  const scored: { p: CatalogProduct; score: number }[] = [];
  for (const p of catalog) {
    if (!f.includeOutOfStock && !isAvailable(p)) continue;
    if (f.minPrice !== null && p.price < f.minPrice) continue;
    if (f.maxPrice !== null && p.price > f.maxPrice) continue;
    if (
      category &&
      !includes(p.categoryName, category) &&
      !includes(p.categorySlug, category)
    )
      continue;
    if (material && !includes(p.material, material) && !p.tags.some((t) => includes(t, material)))
      continue;
    if (color && !p.colors.some((c) => includes(c, color)) && !includes(p.name, color))
      continue;

    const score = query ? queryScore(p, query) : 1;
    if (score > 0) scored.push({ p, score });
  }

  scored.sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));
  return scored.slice(0, MAX_SEARCH_RESULTS).map((s) => s.p);
}

const str = (v: unknown, max = 80): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;

/** Tool input arrives as model output: treat it as untrusted and coerce, never throw. */
export function parseSearchFilters(raw: unknown): SearchFilters {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    query: str(o.query, 200),
    category: str(o.category),
    material: str(o.material),
    color: str(o.color),
    minPrice: num(o.min_price),
    maxPrice: num(o.max_price),
    includeOutOfStock: o.include_out_of_stock === true,
  };
}

export function parseSlugs(raw: unknown): string[] {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (!Array.isArray(o.slugs)) return [];
  const slugs = o.slugs
    .filter((s): s is string => typeof s === "string" && /^[a-z0-9-]{1,120}$/.test(s));
  return [...new Set(slugs)].slice(0, MAX_SEARCH_RESULTS);
}

export function toCard(p: CatalogProduct): ChatProductCard {
  return {
    slug: p.slug,
    name: p.name,
    imageUrl: p.imageUrl,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    isPreorder: p.isPreorder,
  };
}

/** The compact line the model reads for each search hit. */
export function describeForModel(p: CatalogProduct): string {
  const parts = [
    `slug: ${p.slug}`,
    `name: ${p.name}`,
    `category: ${p.categoryName}`,
    `price: TT$${p.price.toFixed(2)}`,
  ];
  if (p.compareAtPrice) parts.push(`was: TT$${p.compareAtPrice.toFixed(2)}`);
  if (p.material) parts.push(`material: ${p.material}`);
  if (p.colors.length) parts.push(`colours: ${p.colors.join(", ")}`);
  if (p.sizes.length) parts.push(`sizes: ${p.sizes.join(", ")}`);
  if (p.isPreorder) parts.push("PREORDER (card or bank transfer only)");
  else if (!isAvailable(p)) parts.push("OUT OF STOCK");
  parts.push(`summary: ${p.shortDescription}`);
  return parts.join(" | ");
}
