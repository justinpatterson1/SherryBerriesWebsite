import Image from "next/image";
import Link from "next/link";
import type { BestsellerProduct, BestsellerPin } from "@/lib/queries/home";
import { WishlistButton } from "./wishlist-button";

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
      className="text-gold tracking-[1px] text-[13px] leading-none"
    >
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

function tagClasses(tag: BestsellerPin) {
  const base =
    "absolute top-3.5 left-3.5 z-[2] py-[5px] px-[11px] rounded-full font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase leading-none";
  switch (tag) {
    case "New":
      return `${base} bg-white text-[#0d0d0d]`;
    case "Bestseller":
      return `${base} bg-gradient-to-br from-pink to-pink-deep text-white shadow-[0_6px_14px_rgba(255,79,163,0.35)]`;
    case "Studio pick":
      return `${base} bg-gradient-to-br from-gold-soft to-gold text-[#2a1a05] shadow-[0_6px_14px_rgba(212,175,55,0.3)]`;
  }
}

export function BestsellerCard({ product }: { product: BestsellerProduct }) {
  return (
    <article
      className={
        "group relative rounded-[18px] bg-card border border-white/[0.06] overflow-hidden flex flex-col " +
        "transition-[transform,border-color,box-shadow] duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
        "hover:-translate-y-1 hover:border-pink " +
        "hover:shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,79,163,0.2)_inset,0_24px_60px_rgba(255,79,163,0.18)]"
      }
    >
      <Link
        href={`/products/${product.slug}`}
        aria-label={product.name}
        className="relative block aspect-square overflow-hidden bg-canvas-2"
      >
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
      </Link>

      {product.pin && <span className={tagClasses(product.pin)}>{product.pin}</span>}

      <WishlistButton productId={product.id} productName={product.name} />

      <button
        type="button"
        aria-label={`Quick add ${product.name}`}
        className={
          "absolute left-3.5 right-3.5 bottom-3.5 z-[2] py-[11px] px-4 rounded-full " +
          "bg-white text-[#0d0d0d] font-sans text-xs font-semibold tracking-[0.14em] uppercase " +
          "border-0 cursor-pointer " +
          "opacity-0 translate-y-3 transition-[opacity,transform,background-color,color] duration-[280ms] " +
          "group-hover:opacity-100 group-hover:translate-y-0 " +
          "hover:bg-gradient-to-br hover:from-pink hover:to-pink-deep hover:text-white hover:shadow-[0_10px_24px_rgba(255,79,163,0.4)] " +
          "max-[900px]:opacity-100 max-[900px]:translate-y-0 " +
          "inline-flex items-center justify-center gap-2"
        }
      >
        Quick add +
      </button>

      <div className="p-4 pb-[18px] flex flex-col gap-2">
        <div className="flex items-center gap-2 font-sans text-[11px] text-ink-faint tracking-[0.04em]">
          <Stars rating={product.rating} />
          <span>
            {product.rating.toFixed(1)} · {product.reviewCount} reviews
          </span>
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="font-serif text-lg leading-[1.25] text-ink no-underline hover:text-pink"
        >
          {product.name}
        </Link>

        {product.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {product.chips.map((chip) => (
              <span
                key={chip}
                className="font-sans text-[9px] font-semibold tracking-[0.14em] uppercase text-blush bg-pink/[0.08] border border-pink/[0.18] py-1 px-2 rounded-full leading-none"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-baseline gap-2.5 mt-1">
          {product.priceOld && (
            <span className="font-sans text-[13px] text-ink-faint line-through">
              ${product.priceOld.toFixed(2)}
            </span>
          )}
          <span className="font-serif text-[19px] font-semibold text-ink">
            ${product.priceNow.toFixed(2)}
          </span>
        </div>
      </div>
    </article>
  );
}
