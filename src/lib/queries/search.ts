import "server-only";
import { prisma } from "@/lib/db";

// Slim, denormalized catalog snapshot used to build the client-side search
// index. Lazy-loaded once (via GET /api/search) the first time the search
// overlay opens, so it adds nothing to normal page loads.

export type SearchIndexProduct = {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  material: string | null;
  tags: string[];
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
};

export type SearchIndexCategory = {
  name: string;
  slug: string;
  description: string | null;
};

export type SearchIndex = {
  products: SearchIndexProduct[];
  categories: SearchIndexCategory[];
};

export async function getSearchIndex(): Promise<SearchIndex> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        material: true,
        price: true,
        compareAtPrice: true,
        category: { select: { name: true, slug: true } },
        images: { orderBy: { position: "asc" }, take: 1, select: { imageUrl: true } },
        tags: { select: { name: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true, description: true },
    }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      categoryName: p.category.name,
      categorySlug: p.category.slug,
      material: p.material,
      tags: p.tags.map((t) => t.name),
      imageUrl: p.images[0]?.imageUrl ?? null,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    })),
    categories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
    })),
  };
}
