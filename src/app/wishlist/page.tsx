import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listProducts } from "@/lib/queries/product";
import { WishlistClient, type RecProduct } from "@/components/wishlist/wishlist-client";

export const metadata: Metadata = {
  title: "Your wishlist | SherryBerries",
  description:
    "The pieces you're dreaming of — saved across every device when you're signed in.",
};

export default async function WishlistPage() {
  // Wishlist is for signed-in customers only — saved to their account, not a
  // guest device. Belt-and-suspenders with the proxy matcher gate.
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/wishlist");

  // Featured-first pool for the "You might also love" rail. The client filters
  // out anything already wishlisted and shows the top few.
  const products = await listProducts();
  const recPool: RecProduct[] = products
    .filter((p) => p.featured)
    .slice(0, 12)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      imageUrl: p.imageUrl,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      categoryName: p.categoryName,
      rating: p.rating,
      reviewCount: p.reviewCount,
    }));

  return <WishlistClient recPool={recPool} />;
}
