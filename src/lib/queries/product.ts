import "server-only";
import { prisma } from "@/lib/db";
import type { JewelryType } from "@/generated/prisma/client";

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getProductBySlug(slug: string) {
  const row = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { value: "asc" } },
      category: true,
      tags: { select: { name: true } },
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, firstName: true, lastName: true } },
        },
      },
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
    featured: row.featured,
    active: row.active,
    material: row.material,
    jewelryType: row.jewelryType,
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
    reviews: row.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt,
      authorName:
        r.user.name ??
        [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") ??
        "Anonymous",
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
  jewelryType: JewelryType;
  categoryName: string;
  categorySlug: string;
  rating: number;
  reviewCount: number;
};

export async function listProducts(opts: {
  categorySlug?: string;
} = {}): Promise<ProductListItem[]> {
  const where: {
    active: boolean;
    category?: { slug: string };
  } = { active: true };
  if (opts.categorySlug) where.category = { slug: opts.categorySlug };

  const rows = await prisma.product.findMany({
    where,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: { select: { name: true, slug: true } },
      reviews: { where: { approved: true }, select: { rating: true } },
    },
  });

  return rows.map((p) => {
    const reviewCount = p.reviews.length;
    const rating =
      reviewCount > 0
        ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
        : 0;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      imageUrl: p.images[0]?.imageUrl ?? null,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      inventory: p.inventory,
      featured: p.featured,
      jewelryType: p.jewelryType,
      categoryName: p.category.name,
      categorySlug: p.category.slug,
      rating,
      reviewCount,
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
  jewelryType,
  limit = 4,
}: {
  currentProductId: string;
  categoryId: string;
  jewelryType: JewelryType;
  limit?: number;
}): Promise<RelatedProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      id: { not: currentProductId },
      active: true,
      OR: [{ categoryId }, { jewelryType }],
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
