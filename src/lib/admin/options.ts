// Client-safe option lists + the product-form payload shape, shared by the
// add/edit modal and the create/update API routes (no server-only deps).


/**
 * Turn a category name into a URL slug. Shared by the form (to preview the
 * address as you type) and the API route (which re-derives it, since the
 * client's value is never trusted) so the two cannot disagree.
 */
export function slugifyCategory(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type CategoryFormData = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  seoTitle: string;
  seoDescription: string;
  /** Whether products here show in the unfiltered Jewelry listing. */
  isJewelry: boolean;
};

/** One size row from the product modal. `id` is null for a row being added. */
export type ProductSizeInput = {
  id: string | null;
  value: string;
  quantity: number;
  additionalPrice: number | null;
};

export type ProductFormData = {
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  reorder: number;
  categoryId: string;
  material: string;
  /** Care & cleaning copy for this product. Blank uses the PDP house copy. */
  careInstructions: string;
  featured: boolean;
  active: boolean;
  imageUrl: string;
  /** The axis the sizes measure — "Length", "Gauge". Empty when unsized. */
  sizeLabel: string;
  sizes: ProductSizeInput[];
};
