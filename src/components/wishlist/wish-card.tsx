import Image from "next/image";
import Link from "next/link";
import type { WishSnapshotItem } from "@/app/api/wishlist/snapshot/route";

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
      fill="currentColor"
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

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}

function timeAgo(iso: string): string | null {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const day = 86400;
  if (secs < 3600) {
    const m = Math.max(1, Math.floor(secs / 60));
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  if (secs < day) {
    const h = Math.floor(secs / 3600);
    return `${h} hr${h === 1 ? "" : "s"} ago`;
  }
  if (secs < day * 7) {
    const d = Math.floor(secs / day);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  const w = Math.floor(secs / (day * 7));
  return `${w} week${w === 1 ? "" : "s"} ago`;
}

function tagPillClass(pin: NonNullable<WishSnapshotItem["pin"]>) {
  const base =
    "absolute top-3.5 left-3.5 z-[2] py-[5px] px-[11px] rounded-full font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase leading-none";
  return pin === "Bestseller"
    ? `${base} bg-gradient-to-br from-pink to-pink-deep text-white shadow-[0_6px_14px_rgba(255,79,163,0.35)]`
    : `${base} bg-white text-[#0d0d0d]`;
}

export function WishCard({
  item,
  inBag,
  removing,
  onRemove,
  onAdd,
}: {
  item: WishSnapshotItem;
  inBag: boolean;
  removing: boolean;
  onRemove: (productId: string) => void;
  onAdd: (productId: string) => void;
}) {
  const added = item.addedAt ? timeAgo(item.addedAt) : null;

  return (
    <article
      data-wish-card={item.productId}
      className={
        "group relative rounded-[20px] bg-card border border-white/[0.06] overflow-hidden flex flex-col " +
        "transition-[transform,opacity,border-color,box-shadow] duration-[300ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
        "hover:-translate-y-1 hover:border-pink " +
        "hover:shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,79,163,0.2)_inset,0_24px_60px_rgba(255,79,163,0.18)] " +
        (removing ? "scale-[0.92] opacity-0 pointer-events-none" : "")
      }
    >
      <div className="relative aspect-square overflow-hidden bg-canvas-2">
        <Link
          href={`/products/${item.slug}`}
          aria-label={item.name}
          className="absolute inset-0 z-[1]"
        />
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
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

        {item.pin && <span className={tagPillClass(item.pin)}>{item.pin}</span>}

        <button
          type="button"
          aria-label={`Remove ${item.name} from wishlist`}
          onClick={() => onRemove(item.productId)}
          className={
            "absolute top-3 right-3 z-[3] w-[34px] h-[34px] rounded-full " +
            "bg-[rgba(13,13,13,0.55)] backdrop-blur-[10px] border border-white/[0.08] text-pink " +
            "inline-flex items-center justify-center cursor-pointer " +
            "transition-[background-color,transform] duration-200 " +
            "hover:bg-gradient-to-br hover:from-pink hover:to-pink-deep hover:text-white hover:scale-[1.12] " +
            "[&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-current " +
            "light:bg-[rgba(255,255,255,0.7)] light:border-[rgba(26,13,18,0.08)]"
          }
        >
          <HeartIcon />
        </button>

        {added && (
          <span
            className={
              "absolute bottom-3 left-3 z-[2] py-1.5 px-2.5 rounded-full " +
              "bg-[rgba(13,13,13,0.55)] backdrop-blur-[10px] border border-white/[0.08] " +
              "font-sans text-[10px] font-medium tracking-[0.08em] text-ink-dim leading-none " +
              "light:bg-[rgba(255,255,255,0.7)] light:border-[rgba(26,13,18,0.08)]"
            }
          >
            Added {added}
          </span>
        )}
      </div>

      <div className="p-4 pb-[18px] flex flex-col gap-2">
        <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-blush">
          {item.categoryName}
        </span>

        <div className="flex items-center gap-2 font-sans text-[11px] text-ink-faint tracking-[0.04em]">
          <Stars rating={item.rating || 4.9} />
          <span>
            {(item.rating || 4.9).toFixed(1)} · {item.reviewCount || 264}
          </span>
        </div>

        <Link
          href={`/products/${item.slug}`}
          className="font-serif text-[18px] leading-[1.25] text-ink no-underline hover:text-pink"
        >
          {item.name}
        </Link>

        {item.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {item.chips.map((chip) => (
              <span
                key={chip}
                className="font-sans text-[9px] font-semibold tracking-[0.14em] uppercase text-blush bg-pink/[0.08] border border-pink/[0.18] py-1 px-2 rounded-full leading-none"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-2">
          <div className="flex items-baseline gap-2">
            {item.compareAtPrice && item.compareAtPrice > item.price && (
              <span className="font-sans text-[13px] text-ink-faint line-through">
                ${item.compareAtPrice.toFixed(2)}
              </span>
            )}
            <span className="font-serif text-[19px] font-semibold text-ink">
              ${item.price.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            aria-label={inBag ? `${item.name} is in your bag` : `Add ${item.name} to bag`}
            onClick={() => onAdd(item.productId)}
            className={
              "inline-flex items-center gap-1.5 py-2 px-3.5 rounded-full cursor-pointer border-0 " +
              "font-sans text-[11px] font-bold tracking-[0.1em] uppercase " +
              "transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-px " +
              "[&_svg]:w-3.5 [&_svg]:h-3.5 " +
              (inBag
                ? "bg-[rgba(58,168,107,0.16)] text-[#3aa86b] border border-[rgba(58,168,107,0.4)]"
                : "bg-gradient-to-br from-pink to-pink-deep text-white shadow-[0_6px_16px_rgba(255,79,163,0.35)]")
            }
          >
            {inBag ? (
              <>
                <span aria-hidden="true">✓</span> In bag
              </>
            ) : (
              <>
                <CartIcon /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
