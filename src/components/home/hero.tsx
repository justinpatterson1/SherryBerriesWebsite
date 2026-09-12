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

// The three reassurances overlaid on the hero image. Each is a live promise to
// a customer — Curepe pickup and nationwide delivery were both confirmed by the
// owner on 2026-09-12. Check anything added here against the shipping policy
// before shipping it, the way the marquee above should have been.
const HERO_FEATURES = [
  { label: "Nationwide", sub: "Delivery", Icon: TruckIcon },
  { label: "Curepe", sub: "Pickup", Icon: PinIcon },
  { label: "Secure", sub: "Payments", Icon: CardIcon },
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

      {/* The image and the copy overlaid on it. The wrapper exists so the copy
          block can drop OUT of the frame below 900px: the frame itself is
          aspect-video and `overflow-hidden`, so at phone widths (~200px tall)
          there is no room for the copy inside it. Above 900px the block is
          absolutely positioned over the left half; below, it goes `static` and
          flows underneath the picture. */}
      <div className="relative w-[75%] self-center max-[900px]:w-[92%]">
        <div
          className={
            "relative aspect-video rounded-[28px] overflow-hidden " +
            "shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset,0_30px_100px_rgba(255,79,163,0.18),0_60px_160px_rgba(255,79,163,0.1)]"
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

          {/* Legibility ramp under the overlaid copy. Only needed while the copy
              is actually on the picture, so it is hidden at the same breakpoint
              the copy leaves the frame. */}
          <div
            aria-hidden="true"
            className={
              "absolute inset-0 max-[900px]:hidden " +
              // Explicit stops rather than from/via/to: the copy block now runs
              // to 64% of the frame, so the ramp has to stay dark well past the
              // midpoint that Tailwind's `via-` assumes.
              "bg-[linear-gradient(90deg,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.7)_38%,rgba(0,0,0,0.35)_62%,rgba(0,0,0,0.08)_82%,transparent_100%)]"
            }
          />

          <div className={`${chipBase} top-7 right-7 max-[900px]:top-3.5 max-[900px]:right-3.5`}>
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

        {/* Overlaid call-to-action copy. The headline is a <p>, not a heading:
            the section's real <h1> lives below the picture, and this restates
            it. Colours are hardcoded white while the block is on the photo,
            then handed back to the theme tokens once it drops below it. */}
        <div
          className={
            "absolute inset-y-0 left-0 w-[64%] z-[1] flex flex-col justify-center gap-6 pl-[8%] pr-6 " +
            "max-[900px]:static max-[900px]:w-full max-[900px]:px-0 max-[900px]:pt-7 max-[900px]:gap-4"
          }
        >
          <span className="font-sans text-[clamp(11px,1vw,14px)] font-semibold tracking-[0.22em] uppercase text-blush">
            Body Jewelry &amp; Aftercare
          </span>

          {/* The line break before "on you." is deliberate, not a reflow
              artefact — the script word is the payoff and gets its own line at
              every width. Below 900px the block is out of the frame and the
              full container width is available, so the break is dropped. */}
          <p className="m-0 font-display text-[clamp(30px,4.6vw,74px)] leading-[1.04] tracking-[-0.015em] text-white max-[900px]:text-ink">
            Piercings look better
            <br className="max-[900px]:hidden" />{" "}
            <span className="font-script text-pink text-[1.3em] leading-[0.9] whitespace-nowrap">
              on you.
              <span className="ml-2 align-middle text-[0.45em]" aria-hidden="true">
                ♡
              </span>
            </span>
          </p>

          <p className="m-0 font-sans text-[clamp(14px,1.35vw,20px)] leading-[1.6] text-white/85 max-w-[34em] max-[900px]:text-ink-dim">
            Body jewelry, piercing aftercare and accessories for your everyday you.
            Sweet like you.
          </p>

          <ul className="flex flex-wrap items-center gap-x-8 gap-y-4 list-none p-0 m-0 mt-1.5">
            {HERO_FEATURES.map(({ label, sub, Icon }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="text-pink shrink-0 [&_svg]:w-[clamp(20px,1.7vw,26px)] [&_svg]:h-[clamp(20px,1.7vw,26px)]">
                  <Icon />
                </span>
                <span className="font-sans text-[clamp(12px,1.05vw,16px)] font-semibold leading-[1.25] text-white max-[900px]:text-ink">
                  {label}
                  <br />
                  {sub}
                </span>
              </li>
            ))}
          </ul>
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

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 16V6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10" />
      <path d="M15 9h3.5a1 1 0 0 1 .8.4L21.8 13a1 1 0 0 1 .2.6V16" />
      <circle cx="7.5" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
      <path d="M9.5 17.5h6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6.5 14.5h3" />
    </svg>
  );
}
