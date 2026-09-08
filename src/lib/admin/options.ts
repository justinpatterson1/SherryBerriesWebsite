// Client-safe option lists + the product-form payload shape, shared by the
// add/edit modal and the create/update API routes (no server-only deps).

export const JEWELRY_TYPES: { value: string; label: string }[] = [
  { value: "BELLY_RING", label: "Belly Ring" },
  { value: "NOSE_RING", label: "Nose Ring" },
  { value: "SEPTUM", label: "Septum" },
  { value: "CARTILAGE", label: "Cartilage" },
  { value: "NIPPLE", label: "Nipple" },
  { value: "EAR_LOBE", label: "Ear Lobe" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "LABRET", label: "Labret" },
  { value: "AFTERCARE", label: "Aftercare" },
  { value: "ELIXIR", label: "Elixir" },
];

export const JEWELRY_TYPE_VALUES = JEWELRY_TYPES.map((t) => t.value);

// Types filed under these are treated as "not jewelry" by the products query,
// so they never surface in the unfiltered Jewelry listing — only on their own
// category page. Mirrors NON_JEWELRY_TYPES in lib/queries/product.ts; kept here
// too so the admin form can warn before the choice hides a product.
export const NON_JEWELRY_TYPE_VALUES = ["AFTERCARE", "ELIXIR"];

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
  jewelryType: string;
  material: string;
  featured: boolean;
  active: boolean;
  imageUrl: string;
  /** The axis the sizes measure — "Length", "Gauge". Empty when unsized. */
  sizeLabel: string;
  sizes: ProductSizeInput[];
};
