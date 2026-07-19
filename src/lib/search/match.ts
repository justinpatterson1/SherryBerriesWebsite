import type {
  SearchIndex,
  SearchIndexProduct,
  SearchIndexCategory,
} from "@/lib/queries/search";

// Pure, client-safe search matching. `import type` above is erased at compile
// time, so the server-only query module is never pulled into the client bundle.

// Match strength: a name hit ranks above a category hit, which ranks above a
// material/tag hit.
const SCORE_NAME = 3;
const SCORE_CATEGORY = 2;
const SCORE_TAG = 1;

export type ProductHit = { product: SearchIndexProduct; score: number };

export function scoreProduct(product: SearchIndexProduct, q: string): number {
  if (product.name.toLowerCase().includes(q)) return SCORE_NAME;
  if (product.categoryName.toLowerCase().includes(q)) return SCORE_CATEGORY;
  if (product.material?.toLowerCase().includes(q)) return SCORE_TAG;
  if (product.tags.some((t) => t.toLowerCase().includes(q))) return SCORE_TAG;
  return 0;
}

function searchProducts(products: SearchIndexProduct[], q: string): ProductHit[] {
  const hits: ProductHit[] = [];
  for (const product of products) {
    const score = scoreProduct(product, q);
    if (score > 0) hits.push({ product, score });
  }
  // Highest score first; stable, readable tiebreak on name.
  hits.sort(
    (a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name),
  );
  return hits;
}

function searchCategories(
  categories: SearchIndexCategory[],
  q: string,
): SearchIndexCategory[] {
  return categories.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.description?.toLowerCase().includes(q) ?? false),
  );
}

export type SearchResults = {
  products: ProductHit[];
  categories: SearchIndexCategory[];
  total: number;
};

const EMPTY: SearchResults = { products: [], categories: [], total: 0 };

export function searchCatalog(
  index: SearchIndex | null,
  rawQuery: string,
): SearchResults {
  const q = rawQuery.trim().toLowerCase();
  if (!index || !q) return EMPTY;
  const products = searchProducts(index.products, q);
  const categories = searchCategories(index.categories, q);
  return { products, categories, total: products.length + categories.length };
}
