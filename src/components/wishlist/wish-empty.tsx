import Link from "next/link";

export function WishEmpty() {
  return (
    <div
      className={
        "relative mx-auto max-w-[480px] p-12 rounded-[24px] " +
        "bg-card border border-white/[0.06] text-center overflow-hidden " +
        "before:content-[''] before:absolute before:inset-0 before:pointer-events-none " +
        "before:bg-[radial-gradient(circle_at_50%_20%,rgba(255,79,163,0.18),transparent_60%)]"
      }
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className="inline-block text-pink text-[64px] leading-none mb-3"
        >
          ♡
        </span>
        <h2 className="font-display text-[clamp(30px,3.4vw,38px)] leading-[1.05] text-ink m-0 mb-3">
          Your wishlist is{" "}
          <em className="font-serif italic text-blush font-medium">waiting</em>.
        </h2>
        <p className="font-sans text-[14px] leading-[1.6] text-ink-dim mb-7">
          Tap the heart on any piece to save it here. Build your dream stack,
          then move it to your bag when you&apos;re ready to glow.
        </p>
        <div className="inline-flex flex-wrap gap-2.5 justify-center">
          <Link
            href="/#bestsellers"
            className={
              "py-3 px-5 rounded-full bg-gradient-to-br from-pink to-pink-deep " +
              "text-white font-sans text-[12px] font-bold tracking-[0.14em] uppercase no-underline " +
              "shadow-[0_10px_24px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
              "transition-transform duration-200 hover:-translate-y-px"
            }
          >
            Explore bestsellers →
          </Link>
          <Link
            href="/products"
            className={
              "py-3 px-5 rounded-full border border-white/14 bg-transparent text-ink-dim " +
              "font-sans text-[12px] font-bold tracking-[0.14em] uppercase no-underline " +
              "transition-[color,border-color,background-color] duration-200 " +
              "hover:text-ink hover:border-blush hover:bg-pink/[0.06]"
            }
          >
            Browse collections
          </Link>
        </div>
      </div>
    </div>
  );
}
