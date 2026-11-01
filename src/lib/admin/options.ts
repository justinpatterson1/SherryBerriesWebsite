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

/** One size from the product modal. `previous` is null for a size being added. */
export type ProductSizeInput = {
  previous: string | null;
  value: string;
  additionalPrice: number | null;
};

/** One colour from the product modal. `id` is null for a colour being added. */
export type ProductColorInput = {
  id: string | null;
  name: string;
  swatch: string;
  imageUrl: string;
  additionalPrice: number | null;
};

/** Stock for one line, named by colour and size (null for an axis it lacks). */
export type ProductStockInput = {
  color: string | null;
  size: string | null;
  quantity: number;
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
  colors: ProductColorInput[];
  /** One entry per colour × size combination, or per colour or size alone. */
  variantStock: ProductStockInput[];
  /** A downloadable product (a PDF) rather than something that ships. */
  isDigital: boolean;
  /** Private R2 object key from /api/admin/upload/digital. Empty when not digital. */
  digitalFileKey: string;
  /** Original upload filename, shown in the form and used for the download. */
  digitalFileName: string;
  /** Sold before the stock exists: no stock, card or bank transfer only. */
  isPreorder: boolean;
};

/** Shape of a key this app will serve as a digital product: `digital/<id>.pdf`. */
const DIGITAL_KEY_RE = /^digital\/[A-Za-z0-9_-]+\.pdf$/;

export type DigitalProductCheck =
  | { ok: true; digitalFileKey: string | null; stock: number; reorder: number }
  | { ok: false; error: string };

/**
 * The rules that make a product digital, shared by the admin form and the API.
 *
 * A download holds no stock — `inventory` is meaningless for a file and is
 * forced to 0 so the low-stock dashboard never flags it and the PDP never says
 * "out of stock". Sizes and colours make no sense either.
 *
 * The key is checked against the `digital/` prefix because it reaches the API
 * as a plain string from the browser: pointed at a `payments/` key instead, the
 * download route would serve another customer's bank receipt to whoever bought
 * the product.
 */
export function validateDigitalProduct(input: {
  isDigital: boolean;
  digitalFileKey: string;
  /** Stock lines: sizes, colours, or their combinations. */
  sizeCount: number;
  stock: number;
  reorder: number;
}): DigitalProductCheck {
  if (!input.isDigital) {
    return { ok: true, digitalFileKey: null, stock: input.stock, reorder: input.reorder };
  }
  if (input.sizeCount > 0) {
    return { ok: false, error: "A digital product can't have sizes or colours." };
  }
  const key = input.digitalFileKey.trim();
  if (!key) {
    return { ok: false, error: "Upload the PDF before saving a digital product." };
  }
  if (key.includes("..") || !DIGITAL_KEY_RE.test(key)) {
    return { ok: false, error: "That file reference isn't valid. Re-upload the PDF." };
  }
  return { ok: true, digitalFileKey: key, stock: 0, reorder: 0 };
}
