import Image from "next/image";
import Link from "next/link";
import heroBanner from "../../../assets/images/hero.jpg";

// "Free piercing aftercare guide" removed 2026-08-17 — no such guide exists.
// This marquee has now lost three claims in three passes (free shipping over
// $80, Pay in 4 with Afterpay, the aftercare guide); check anything added here
// against what the site actually does before shipping it.
const MARQUEE_ITEMS = [
  "Serving Sweet Looks Since Forever. 🍓",
  "Warning: Compliments May Occur",
  "SELF-LOVE LOOKS GOOD ON YOU",
  "Sweet like you",
];

const chipBase =
  "absolute flex items-center gap-3 py-3 pl-3 pr-[18px] rounded-full " +
  "bg-[rgba(15,12,13,0.72)] border border-white/[0.08] " +
  "backdrop-blur-[16px] backdrop-saturate-150 text-ink " +
  "shadow-[0_10px_30px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,79,163,0.12)_inset] " +
  "animate-hero-float " +
  "max-[900px]:py-2 max-[900px]:pl-2 max-[900px]:pr-3";

const ctaBase =
  "relative inline-flex items-center justify-center gap-2.5 py-4 px-7 rounded-full " +
  "font-sans text-[13px] font-semibold tracking-[0.14em] uppercase no-underline cursor-pointer " +
  "border border-transparent overflow-hidden " +
  "transition-[transform,box-shadow,background-color,color] duration-[220ms]";

export function Hero() {
  return (
    <section className="relative isolate pt-[120px] flex flex-col gap-14 max-[900px]:pt-[100px] max-[900px]:gap-8">
      <div className="hero-glow" aria-hidden="true" />

      <div className="w-full px-[8%] flex justify-center max-[900px]:px-[6%]">
        <span className="inline-flex items-center gap-2.5 py-2 px-4 rounded-full border border-pink/[0.28] bg-pink/[0.06] text-blush font-sans text-[11px] font-medium tracking-[0.18em] uppercase">
          <span
            aria-hidden="true"
            className="w-[7px] h-[7px] rounded-full bg-pink animate-hero-pulse"
          />
          Luxury Body Jewelry · Piercing Aftercare · Est. 2017
        </span>
      </div>

      <div
        className={
          "relative w-[75%] self-center aspect-video rounded-[28px] overflow-hidden " +
          "shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset,0_30px_100px_rgba(255,79,163,0.18),0_60px_160px_rgba(255,79,163,0.1)] " +
          "max-[900px]:w-[92%]"
        }
      >
        <Image
          src={heroBanner}
          alt="SherryBerries luxury body jewelry editorial"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          placeholder="blur"
          className="object-cover"
        />

        <div className={`${chipBase} top-7 left-7 max-[900px]:top-3.5 max-[900px]:left-3.5`}>
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-pink to-pink-deep inline-flex items-center justify-center text-white shrink-0 shadow-[0_6px_16px_rgba(255,79,163,0.45)] [&_svg]:w-[18px] [&_svg]:h-[18px] max-[900px]:w-7 max-[900px]:h-7 max-[900px]:[&_svg]:w-3.5 max-[900px]:[&_svg]:h-3.5">
            <ShieldIcon />
          </span>
          <div>
            <div className="font-sans text-[11px] font-semibold text-ink-faint tracking-[0.14em] uppercase leading-none mb-1 max-[900px]:text-[9px]">
              Hypoallergenic
            </div>
            <div className="font-sans text-sm font-semibold text-ink leading-[1.2] max-[900px]:text-xs">
              Skin-safe by design
            </div>
          </div>
        </div>

      </div>

      <div className="w-full px-[8%] max-[900px]:px-[6%]">
        <div className="grid grid-cols-[1.15fr_1fr] gap-16 items-start max-[900px]:grid-cols-1 max-[900px]:gap-8">
          <div>
            <h1 className="font-display text-[clamp(40px,5.4vw,76px)] leading-[1.04] tracking-[-0.01em] text-ink m-0">
              Luxury body jewelry &amp;{" "}
              <span className="font-serif italic font-medium">piercing aftercare</span>{" "}
              for every version of{" "}
              <span className="font-serif italic bg-gradient-to-r from-pink to-gold-soft bg-clip-text text-transparent">
                you
              </span>
            </h1>
            <p className="font-sans text-[17px] leading-[1.65] text-ink-dim mt-6 mb-0 max-w-[540px]">
              Implant-grade titanium, gold-fill, and editorial-grade pieces — paired with
              aftercare that treats your piercing like skincare. Crafted in Trinidad,
              loved worldwide.
            </p>
          </div>

          <div className="flex flex-col gap-7 pt-3 max-[900px]:pt-0">
            <div className="flex flex-wrap gap-3.5">
              <Link
                href="/products"
                className={
                  ctaBase +
                  " group/cta bg-gradient-to-br from-pink to-pink-deep text-white " +
                  "shadow-[0_12px_30px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
                  "hover:-translate-y-0.5 " +
                  "hover:shadow-[0_18px_38px_rgba(255,79,163,0.5),0_0_0_1px_rgba(255,255,255,0.16)_inset] " +
                  // shimmer
                  "after:content-[''] after:absolute after:top-0 after:-left-[120%] after:w-[80%] after:h-full " +
                  "after:bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.4),transparent)] after:skew-x-[-20deg] " +
                  "after:transition-[left] after:duration-[700ms] hover:after:left-[120%]"
                }
              >
                Shop Jewelry
              </Link>
              <Link
                href="/products?category=aftercare"
                className={
                  ctaBase +
                  " bg-white/[0.04] text-ink border-white/[0.14] backdrop-blur-[10px] " +
                  "light:bg-[rgba(26,13,18,0.04)] light:border-[rgba(26,13,18,0.14)] " +
                  "hover:-translate-y-0.5 hover:bg-pink/[0.08] hover:border-pink"
                }
              >
                Shop Aftercare
              </Link>
            </div>

          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className={
          "w-full mt-6 py-[18px] border-t border-b border-line overflow-hidden relative " +
          "[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] " +
          "[-webkit-mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
        }
      >
        {/* Two identical halves and NO gap between them: the animation runs
            translateX(0 → -50%), which lands seamlessly only when half the
            track is exactly one half's width. A flex gap here would make every
            cycle fall short by half that gap and visibly jump. The spacing
            after each phrase lives inside the half instead (pr-12). */}
        <div className="flex w-max animate-hero-marquee">
          <MarqueeHalf />
          <MarqueeHalf />
        </div>
      </div>
    </section>
  );
}

// One pass of the list is only ~600px wide now that two phrases are left —
// narrower than any desktop viewport, which left visible dead space mid-loop.
// Repeating the list inside each half makes the track wide enough to always
// cover the screen. Bump this if the list shrinks further.
const REPEATS = 4;

function MarqueeHalf() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-12 pr-12 font-sans text-[13px] font-medium tracking-[0.18em] uppercase text-ink-dim whitespace-nowrap"
    >
      {Array.from({ length: REPEATS }).flatMap((_, pass) =>
        MARQUEE_ITEMS.map((item, i) => (
          <span
            key={`${pass}-${item}-${i}`}
            className="inline-flex items-center gap-12 whitespace-nowrap"
          >
            <span>{item}</span>
            <span className="text-pink text-sm">✦</span>
          </span>
        )),
      )}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.5 9.3 8 11 4.5-1.7 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
