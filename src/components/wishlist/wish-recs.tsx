import Image from "next/image";
import Link from "next/link";
import type { RecProduct } from "./wishlist-client";

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
      className="text-gold tracking-[1px] text-[13px] leading-none light:text-[#b8860b]"
    >
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function WishRecs({
  recs,
  onAdd,
}: {
  recs: RecProduct[];
  onAdd: (productId: string) => void;
}) {
  if (recs.length === 0) return null;

  return (
    <section
      aria-labelledby="wish-recs-title"
      className="mt-16 pt-12 border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)] max-[900px]:mt-12"
    >
      <div className="text-center max-w-[560px] mx-auto mb-10">
        <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-pink">
          Picked for you
        </span>
        <h2
          id="wish-recs-title"
          className="font-display text-[clamp(30px,3.4vw,44px)] leading-[1.06] tracking-[-0.01em] text-ink m-0 mt-3"
        >
          You might also{" "}
          <span className="font-serif italic text-blush">love</span>.
        </h2>
        <p className="font-sans text-[14px] leading-[1.6] text-ink-dim m-0 mt-3">
          A few more pieces from the studio, chosen to glow with your stack.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-[22px] max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {recs.map((product) => (
          <article
            key={product.id}
            className={
              "group relative rounded-[18px] bg-card border border-white/[0.06] overflow-hidden flex flex-col " +
              "transition-[transform,border-color,box-shadow] duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
              "hover:-translate-y-1 hover:border-pink " +
              "hover:shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,79,163,0.2)_inset,0_24px_60px_rgba(255,79,163,0.18)]"
            }
          >
            <div className="relative aspect-square overflow-hidden bg-canvas-2">
              <Link
                href={`/products/${product.slug}`}
                aria-label={product.name}
                className="absolute inset-0 z-[1]"
              />
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-br from-pink to-pink-deep transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
                />
              )}

              <button
                type="button"
                data-wishadd={product.id}
                aria-label={`Save ${product.name} to wishlist`}
                onClick={() => onAdd(product.id)}
                className={
                  "absolute top-3 right-3 z-[2] w-[34px] h-[34px] rounded-full " +
                  "bg-[rgba(13,13,13,0.55)] backdrop-blur-[10px] border border-white/[0.08] text-ink-dim " +
                  "inline-flex items-center justify-center cursor-pointer " +
                  "transition-[color,background-color,transform] duration-200 " +
                  "hover:text-pink hover:bg-[rgba(13,13,13,0.75)] hover:scale-[1.08] " +
                  "[&_svg]:w-4 [&_svg]:h-4 " +
                  "light:bg-[rgba(255,255,255,0.7)] light:border-[rgba(26,13,18,0.08)]"
                }
              >
                <HeartIcon />
              </button>
            </div>

            <div className="p-4 pb-[18px] flex flex-col gap-2">
              <div className="flex items-center gap-2 font-sans text-[11px] text-ink-faint tracking-[0.04em]">
                <Stars rating={product.rating || 4.9} />
                <span>
                  {(product.rating || 4.9).toFixed(1)} · {product.reviewCount || 264}
                </span>
              </div>

              <Link
                href={`/products/${product.slug}`}
                className="font-serif text-lg leading-[1.25] text-ink no-underline hover:text-pink"
              >
                {product.name}
              </Link>

              <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-ink-faint">
                {product.categoryName}
              </span>

              <div className="flex items-baseline gap-2.5 mt-1">
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="font-sans text-[13px] text-ink-faint line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
                <span className="font-serif text-[19px] font-semibold text-ink">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
