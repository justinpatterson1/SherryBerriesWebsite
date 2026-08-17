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
