import Image from "next/image";
import Link from "next/link";
import type { RelatedProduct } from "@/lib/queries/product";

export function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="related-title"
      className="pt-6 pb-[100px] px-[8%] max-[900px]:px-[6%] max-[900px]:pb-20"
    >
      <div className="flex flex-col gap-3.5 mb-10">
        <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-pink">
          You may also love
        </span>
        <h2
          id="related-title"
          className="font-display text-[clamp(32px,3.6vw,48px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
        >
          More from the studio
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-[22px] max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className={
              "group block rounded-[18px] bg-card border border-white/[0.06] overflow-hidden no-underline " +
              "transition-[transform,border-color,box-shadow] duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
              "hover:-translate-y-1 hover:border-pink " +
              "hover:shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,79,163,0.2)_inset]"
            }
          >
            <div className="relative aspect-square overflow-hidden bg-canvas-2">
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-br from-pink to-pink-deep"
                />
              )}
            </div>
            <div className="p-4 pb-5 flex flex-col gap-2">
              <span className="font-serif text-[17px] leading-[1.25] text-ink">
                {p.name}
              </span>
              <div className="flex items-baseline gap-2.5">
                {p.compareAtPrice && p.compareAtPrice > p.price && (
                  <span className="font-sans text-[13px] text-ink-faint line-through">
                    ${p.compareAtPrice.toFixed(2)}
                  </span>
                )}
                <span className="font-serif text-[18px] font-semibold text-ink">
                  ${p.price.toFixed(2)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
