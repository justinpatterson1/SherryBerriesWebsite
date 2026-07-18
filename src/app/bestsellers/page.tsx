import type { Metadata } from "next";
import { getBestsellers } from "@/lib/queries/home";
import { BestsellerCard } from "@/components/home/bestseller-card";

export const metadata: Metadata = {
  title: "Bestsellers | SherryBerries",
  description:
    "The pieces our customers reach for again and again — our most-loved body jewelry and aftercare, all in one place.",
};

export default async function BestsellersPage() {
  const products = await getBestsellers(48);

  return (
    <main
      aria-labelledby="bestsellers-title"
      className="pt-16 pb-[100px] px-[8%] relative max-[900px]:pt-10 max-[900px]:pb-20 max-[900px]:px-[6%]"
    >
      <div className="flex flex-col gap-3.5 mb-12 max-w-[720px] max-[900px]:mb-8">
        <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-pink">
          Loved by everyone
        </span>
        <h1
          id="bestsellers-title"
          className="font-display text-[clamp(36px,4vw,56px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
        >
          Our <span className="font-serif italic text-blush">bestselling</span> pieces.
        </h1>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-4 gap-[22px] max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
          {products.map((product) => (
            <BestsellerCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <p className="font-sans text-sm text-ink-faint">
          No bestsellers just yet — check back soon.
        </p>
      )}
    </main>
  );
}
