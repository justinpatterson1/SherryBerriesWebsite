import "server-only";
import { prisma } from "@/lib/db";

export type HomeCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
};

/**
 * Every category, or the first `limit` of them by name. The homepage caps its
 * grid; the /products filter bar deliberately does not, so a category is always
 * reachable even when it is not one of the ones featured on the homepage.
 */
export async function getHomeCategories(limit?: number): Promise<HomeCategory[]> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      imageUrl: true,
    },
  });
}

/**
 * The categories the homepage grid features, in the order they appear.
 *
 * Explicit rather than "the first N by name": there are more categories than
 * slots, so alphabetical truncation silently decided which one fell off the
 * end. Swapping a tile is now an edit to this list. Anything not listed here
 * is still reachable from the /products filter bar, which is uncapped.
 */
export const FEATURED_CATEGORY_SLUGS = [
  "accessories",
  "aftercare",
  "belly-rings",
  "cartilage-jewelry",
  "elixirs",
  "merch",
  "nose-rings",
  "tongue-ring",
] as const;

/** The homepage grid's categories, ordered by FEATURED_CATEGORY_SLUGS. */
export async function getFeaturedCategories(): Promise<HomeCategory[]> {
  const rows = await prisma.category.findMany({
    where: { slug: { in: [...FEATURED_CATEGORY_SLUGS] } },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      imageUrl: true,
    },
  });
  // Order in JS: the list above is the source of truth, and a slug missing
  // from the database simply leaves the grid one tile shorter.
  const order = new Map(FEATURED_CATEGORY_SLUGS.map((slug, i) => [slug as string, i]));
  return rows.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}

export type BestsellerPin = "Bestseller" | "New" | "Studio pick";

export type BestsellerProduct = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  priceNow: number;
  priceOld?: number;
  chips: string[];
  pin?: BestsellerPin;
};

const PIN_PRIORITY: Array<{ tag: string; pin: BestsellerPin }> = [
  { tag: "Bestseller", pin: "Bestseller" },
  { tag: "New", pin: "New" },
  { tag: "Studio Pick", pin: "Studio pick" },
];

const CHIP_TAGS = new Set([
  "Hypoallergenic",
  "Titanium Safe",
  "Implant Grade",
  "14k Gold",
  "Sensitive Skin",
]);

export async function getBestsellers(limit = 8): Promise<BestsellerProduct[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, featured: true },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      tags: { select: { name: true } },
    },
  });

  return rows.map((p) => {
    const tagNames = p.tags.map((t) => t.name);
    const pinMatch = PIN_PRIORITY.find((p) => tagNames.includes(p.tag));
    const chips = tagNames.filter((t) => CHIP_TAGS.has(t)).slice(0, 2);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      imageUrl: p.images[0]?.imageUrl ?? null,
      priceNow: Number(p.price),
      priceOld: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
      chips,
      pin: pinMatch?.pin,
    };
  });
}
