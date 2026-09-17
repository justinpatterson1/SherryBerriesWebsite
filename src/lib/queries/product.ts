import "server-only";
import { prisma } from "@/lib/db";

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getProductBySlug(slug: string) {
  const row = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { value: "asc" } },
      category: true,
      tags: { select: { name: true } },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    description: row.description,
    sku: row.sku,
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
    inventory: row.inventory,
    lowStockThreshold: row.lowStockThreshold,
    isDigital: row.isDigital,
    featured: row.featured,
    active: row.active,
    material: row.material,
    careInstructions: row.careInstructions,
    healingStage: row.healingStage,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    category: row.category,
    categoryId: row.categoryId,
    tags: row.tags.map((t) => t.name),
    images: row.images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      altText: img.altText,
      position: img.position,
    })),
    variants: row.variants.map((v) => ({
      id: v.id,
      name: v.name,
      value: v.value,
      sku: v.sku,
      inventory: v.inventory,
      additionalPrice: v.additionalPrice ? Number(v.additionalPrice) : 0,
    })),
  };
}

export type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  inventory: number;
  featured: boolean;
  categoryName: string;
  categorySlug: string;
};

export async function listProducts(opts: {
  categorySlug?: string;
  jewelryOnly?: boolean;
} = {}): Promise<ProductListItem[]> {
  // "Is this jewelry?" is a property of the category, not of the product: it
  // used to be inferred from the Product.jewelryType enum, which an admin could
  // not extend. Aftercare, elixirs, accessories and merch are flagged
  // isJewelry=false so they surface only on their own category pages.
  const where: {
    active: boolean;
    category?: { slug: string } | { isJewelry: boolean };
  } = { active: true };
  if (opts.categorySlug) where.category = { slug: opts.categorySlug };
  else if (opts.jewelryOnly) where.category = { isJewelry: true };

  const rows = await prisma.product.findMany({
    where,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
  });

  return rows.map((p) => {
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      imageUrl: p.images[0]?.imageUrl ?? null,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      inventory: p.inventory,
      featured: p.featured,
      categoryName: p.category.name,
      categorySlug: p.category.slug,
    };
  });
}

export type RelatedProduct = {
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
};

export async function getRelatedProducts({
  currentProductId,
  categoryId,
  limit = 4,
}: {
  currentProductId: string;
  categoryId: string;
  limit?: number;
}): Promise<RelatedProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      id: { not: currentProductId },
      active: true,
      // Category alone now. This used to also match on jewelryType, which was
      // the only way a Nose Ring could relate to a Septum piece — but that enum
      // and Category were describing the same thing, and only one was editable.
      categoryId,
    },
    take: limit,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
    },
  });
  return rows.map((p) => ({
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.imageUrl ?? null,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
  }));
}
