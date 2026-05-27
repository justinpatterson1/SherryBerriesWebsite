import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="pt-[160px] pb-20 px-[8%] max-[900px]:px-[6%] flex flex-col items-center text-center">
      <span className="font-sans text-[11px] tracking-[0.22em] uppercase text-pink mb-3">
        Out of stock — or out of orbit
      </span>
      <h1 className="font-display text-[clamp(40px,4.4vw,60px)] leading-[1.05] tracking-[-0.01em] text-ink m-0 mb-4">
        We can&apos;t find that piece.
      </h1>
      <p className="font-serif italic text-[17px] text-ink-dim max-w-[460px] mb-7">
        It may have sold out or been renamed. Wander back to the shop and pick a new
        favorite.
      </p>
      <Link
        href="/"
        className={
          "py-3.5 px-7 rounded-full bg-gradient-to-br from-pink to-pink-deep " +
          "text-white font-sans text-sm font-bold tracking-[0.16em] uppercase no-underline " +
          "shadow-[0_10px_28px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
          "transition-transform duration-200 hover:-translate-y-px"
        }
      >
        Back to the shop
      </Link>
    </main>
  );
}
