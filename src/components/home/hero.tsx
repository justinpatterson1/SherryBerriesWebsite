import Image from "next/image";
import Link from "next/link";
import heroBanner from "../../../assets/images/Hero.png";

const MARQUEE_ITEMS = [
  "Free shipping over $80",
  "Implant-grade titanium",
  "Hypoallergenic certified",
  "Free piercing aftercare guide",
  "Pay in 4 with Afterpay",
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
          Luxury Body Jewelry · Piercing Aftercare · Est. 2022
        </span>
      </div>

      <div
        className={
          "relative w-[75%] self-center aspect-[1672/941] rounded-[28px] overflow-hidden " +
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

        <div className={`${chipBase} bottom-7 right-7 [animation-delay:-3s] max-[900px]:bottom-3.5 max-[900px]:right-3.5`}>
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-pink to-pink-deep inline-flex items-center justify-center text-white shrink-0 shadow-[0_6px_16px_rgba(255,79,163,0.45)] [&_svg]:w-[18px] [&_svg]:h-[18px] max-[900px]:w-7 max-[900px]:h-7 max-[900px]:[&_svg]:w-3.5 max-[900px]:[&_svg]:h-3.5">
            <StarIcon />
          </span>
          <div>
            <div className="font-sans text-[11px] font-semibold text-ink-faint tracking-[0.14em] uppercase leading-none mb-1 max-[900px]:text-[9px]">
              4.9 / 5
            </div>
            <div className="font-sans text-sm font-semibold text-ink leading-[1.2] max-[900px]:text-xs">
              2,400+ reviews
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-[8%] max-[900px]:px-[6%]">
        <div className="grid grid-cols-[1.15fr_1fr] gap-16 items-start max-[900px]:grid-cols-1 max-[900px]:gap-8">
          <div>
            <h1 className="font-display text-[clamp(40px,5.4vw,76px)] leading-[1.04] tracking-[-0.01em] text-ink m-0">
              Luxury body jewelry &amp;{" "}
              <span className="font-serif italic font-medium">piercing care</span>{" "}
              designed to make you{" "}
              <span className="font-serif italic bg-gradient-to-r from-pink to-gold-soft bg-clip-text text-transparent">
                glow
              </span>{" "}
              confidently.
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

            <div className="flex items-center gap-4 py-4 px-5 rounded-[20px] bg-[rgba(15,12,13,0.6)] border border-white/[0.06] backdrop-blur-[16px] max-w-[420px] light:bg-white/65 light:border-[rgba(26,13,18,0.08)]">
              <div className="flex shrink-0" aria-hidden="true">
                <span className="w-9 h-9 rounded-full border-2 border-canvas bg-gradient-to-br from-[#ff8fbf] to-[#d63a85]" />
                <span className="w-9 h-9 rounded-full border-2 border-canvas -ml-2.5 bg-gradient-to-br from-[#f7b6d2] to-[#b06e8a]" />
                <span className="w-9 h-9 rounded-full border-2 border-canvas -ml-2.5 bg-gradient-to-br from-[#e8c879] to-[#9a7b1e]" />
                <span className="w-9 h-9 rounded-full border-2 border-canvas -ml-2.5 bg-gradient-to-br from-[#ffb4d7] to-pink" />
              </div>
              <div className="font-sans text-[13px] text-ink-dim leading-[1.4]">
                <strong className="block text-ink font-semibold text-sm mb-0.5">
                  Trusted by 12,400+ sweet berries
                </strong>
                worldwide — and counting.
              </div>
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
        <div className="flex w-max gap-12 animate-hero-marquee">
          <MarqueeRow />
          <MarqueeRow />
        </div>
      </div>
    </section>
  );
}

function MarqueeRow() {
  return (
    <div className="inline-flex items-center gap-12 font-sans text-[13px] font-medium tracking-[0.18em] uppercase text-ink-dim whitespace-nowrap">
      {MARQUEE_ITEMS.map((item, i) => (
        <span key={`${item}-${i}`} className="inline-flex items-center gap-12 whitespace-nowrap">
          <span>{item}</span>
          <span className="text-pink text-sm">✦</span>
        </span>
      ))}
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

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5 14.9 9l7 .6-5.3 4.6L18.2 21 12 17.3 5.8 21l1.6-6.8L2.1 9.6l7-.6L12 2.5z" />
    </svg>
  );
}
