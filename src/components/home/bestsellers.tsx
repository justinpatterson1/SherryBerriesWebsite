import { getBestsellers } from "@/lib/queries/home";
import { BestsellerCard } from "./bestseller-card";

export async function Bestsellers() {
  const products = await getBestsellers(8);

  return (
    <section
      aria-labelledby="bs-title"
      className="pt-10 pb-[100px] px-[8%] relative max-[900px]:pt-5 max-[900px]:pb-20 max-[900px]:px-[6%]"
    >
      <div className="flex flex-col gap-3.5 mb-12 max-w-[720px] max-[900px]:mb-8">
        <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-pink">
          Trending now
        </span>
        <h2
          id="bs-title"
          className="font-display text-[clamp(36px,4vw,56px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
        >
          Bestsellers from <span className="font-serif italic text-blush">sweet</span>{" "}
          berries.
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-[22px] max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {products.map((product) => (
          <BestsellerCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
