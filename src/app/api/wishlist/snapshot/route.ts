import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type WishSnapshotItem = {
  productId: string;
  slug: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  chips: string[];
  pin: "Bestseller" | "New" | null;
  addedAt: string | null;
};

const CHIP_TAGS = new Set([
  "Hypoallergenic",
  "Titanium Safe",
  "Implant Grade",
  "14k Gold",
  "Sensitive Skin",
]);

function pinFor(tagNames: string[]): WishSnapshotItem["pin"] {
  if (tagNames.includes("Bestseller")) return "Bestseller";
  if (tagNames.includes("New")) return "New";
  return null;
}

export async function POST() {
  const session = await auth();

  // Wishlist is for signed-in customers only — IDs (+ added timestamps) always
  // come from the user's DB wishlist, never a guest request body.
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view your wishlist." }, { status: 401 });
  }

  const rows = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { productId: true, createdAt: true },
  });
  const ids = rows.map((r) => r.productId);
  const addedById = new Map<string, Date>(rows.map((r) => [r.productId, r.createdAt]));

  if (ids.length === 0) return NextResponse.json({ items: [] });

  const products = await prisma.product.findMany({
    where: { id: { in: Array.from(new Set(ids)) }, active: true },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: { select: { name: true } },
      tags: { select: { name: true } },
      reviews: { where: { approved: true }, select: { rating: true } },
    },
  });

  const productById = new Map(products.map((p) => [p.id, p]));

  // Preserve the incoming order (DB: newest-saved first; guest: list order).
  const items: WishSnapshotItem[] = ids.flatMap((id) => {
    const p = productById.get(id);
    if (!p) return [];
    const reviewCount = p.reviews.length;
    const rating =
      reviewCount > 0
        ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
        : 0;
    const tagNames = p.tags.map((t) => t.name);
    const chips = [
      ...(p.material ? [p.material] : []),
      ...tagNames.filter((t) => CHIP_TAGS.has(t)),
    ].slice(0, 3);
    const added = addedById.get(id);
    return [
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        categoryName: p.category.name,
        imageUrl: p.images[0]?.imageUrl ?? null,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        rating,
        reviewCount,
        chips,
        pin: pinFor(tagNames),
        addedAt: added ? added.toISOString() : null,
      },
    ];
  });

  return NextResponse.json({ items });
}
