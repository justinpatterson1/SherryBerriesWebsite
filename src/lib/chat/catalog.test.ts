import { describe, it, expect } from "vitest";
import {
  describeForModel,
  filterCatalog,
  isAvailable,
  parseSearchFilters,
  parseSlugs,
  type CatalogProduct,
  type SearchFilters,
} from "./catalog";

function product(over: Partial<CatalogProduct>): CatalogProduct {
  return {
    slug: "p",
    name: "Product",
    shortDescription: "",
    categoryName: "Cartilage Jewelry",
    categorySlug: "cartilage-jewelry",
    material: null,
    tags: [],
    colors: [],
    sizes: [],
    imageUrl: null,
    price: 100,
    compareAtPrice: null,
    inventory: 5,
    variantInventory: [],
    isPreorder: false,
    isDigital: false,
    ...over,
  };
}

const NONE: SearchFilters = {
  query: null,
  category: null,
  material: null,
  color: null,
  minPrice: null,
  maxPrice: null,
  includeOutOfStock: false,
};

describe("isAvailable", () => {
  it("uses product inventory when there are no variants", () => {
    expect(isAvailable(product({ inventory: 1 }))).toBe(true);
    expect(isAvailable(product({ inventory: 0 }))).toBe(false);
  });
  it("needs any variant in stock when variants exist", () => {
    expect(isAvailable(product({ inventory: 0, variantInventory: [0, 2] }))).toBe(true);
    expect(isAvailable(product({ inventory: 9, variantInventory: [0, 0] }))).toBe(false);
  });
  it("treats preorders and downloads as always available", () => {
    expect(isAvailable(product({ inventory: 0, isPreorder: true }))).toBe(true);
    expect(isAvailable(product({ inventory: 0, isDigital: true }))).toBe(true);
  });
});

describe("filterCatalog", () => {
  const catalog = [
    product({ slug: "helix-hoop", name: "Gold Helix Hoop", material: "14k Gold", price: 180, colors: ["Gold"] }),
    product({ slug: "nose-stud", name: "Crystal Nose Stud", categoryName: "Nose Rings", categorySlug: "nose-rings", material: "Titanium", price: 90 }),
    product({ slug: "sold-out", name: "Helix Clicker", price: 120, inventory: 0 }),
    product({ slug: "spray", name: "Aftercare Spray", categoryName: "Aftercare", categorySlug: "aftercare", price: 60, tags: ["saline"] }),
  ];

  it("ranks name matches first and drops non-matches", () => {
    const hits = filterCatalog(catalog, { ...NONE, query: "helix hoop" });
    expect(hits.map((p) => p.slug)).toEqual(["helix-hoop"]);
  });

  it("hides out-of-stock unless asked", () => {
    expect(filterCatalog(catalog, { ...NONE, query: "clicker" })).toEqual([]);
    expect(
      filterCatalog(catalog, { ...NONE, query: "clicker", includeOutOfStock: true }).map((p) => p.slug),
    ).toEqual(["sold-out"]);
  });

  it("applies price, category, material and colour filters", () => {
    expect(filterCatalog(catalog, { ...NONE, maxPrice: 100 }).map((p) => p.slug)).toEqual(["spray", "nose-stud"]);
    expect(filterCatalog(catalog, { ...NONE, category: "nose-rings" }).map((p) => p.slug)).toEqual(["nose-stud"]);
    expect(filterCatalog(catalog, { ...NONE, material: "titanium" }).map((p) => p.slug)).toEqual(["nose-stud"]);
    expect(filterCatalog(catalog, { ...NONE, color: "gold" }).map((p) => p.slug)).toEqual(["helix-hoop"]);
    expect(filterCatalog(catalog, { ...NONE, minPrice: 150 }).map((p) => p.slug)).toEqual(["helix-hoop"]);
  });

  it("matches tags in the query", () => {
    expect(filterCatalog(catalog, { ...NONE, query: "saline" }).map((p) => p.slug)).toEqual(["spray"]);
  });

  it("caps results at 6", () => {
    const many = Array.from({ length: 10 }, (_, i) => product({ slug: `p${i}`, name: `Ring ${i}` }));
    expect(filterCatalog(many, { ...NONE, query: "ring" })).toHaveLength(6);
  });
});

describe("parseSearchFilters", () => {
  it("coerces junk to nulls instead of throwing", () => {
    expect(parseSearchFilters(null)).toEqual(NONE);
    expect(parseSearchFilters({ query: 3, max_price: -5, min_price: "10" })).toEqual(NONE);
  });
  it("keeps valid values", () => {
    expect(parseSearchFilters({ query: " hoop ", max_price: 200, include_out_of_stock: true })).toEqual({
      ...NONE,
      query: "hoop",
      maxPrice: 200,
      includeOutOfStock: true,
    });
  });
});

describe("parseSlugs", () => {
  it("keeps well-formed, unique slugs, max 6", () => {
    expect(parseSlugs({ slugs: ["a-b", "a-b", "Bad Slug", 4, "c"] })).toEqual(["a-b", "c"]);
    expect(parseSlugs({ slugs: Array.from({ length: 9 }, (_, i) => `s${i}`) })).toHaveLength(6);
    expect(parseSlugs({})).toEqual([]);
  });
});

describe("describeForModel", () => {
  it("flags preorders and sold-out items", () => {
    expect(describeForModel(product({ isPreorder: true, inventory: 0 }))).toContain("PREORDER");
    expect(describeForModel(product({ inventory: 0 }))).toContain("OUT OF STOCK");
    expect(describeForModel(product({ price: 85 }))).toContain("TT$85.00");
  });
});
