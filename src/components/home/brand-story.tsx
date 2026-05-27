import Image from "next/image";
import Link from "next/link";
import tallImg from "../../../assets/images/bellyring.jpg";
import sqImg from "../../../assets/images/merchandise.jpg";
import wideImg from "../../../assets/images/aftercare.jpg";

const tileClass =
  "relative rounded-[18px] overflow-hidden bg-canvas-2 " +
  "shadow-[0_18px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)_inset] " +
  "[&_img]:object-cover";

export function BrandStory() {
  return (
    <section
      aria-labelledby="story-title"
      className={
        "relative py-[100px] px-[8%] isolate overflow-hidden " +
        // pink radial glow behind the right column
        "before:content-[''] before:absolute before:-top-[10%] before:-right-[10%] " +
        "before:w-[720px] before:h-[720px] before:rounded-full " +
        "before:bg-[radial-gradient(circle,rgba(255,79,163,0.32),transparent_65%)] before:blur-[80px] " +
        "before:-z-10 before:pointer-events-none " +
        "max-[1100px]:py-20 max-[1100px]:px-[10%] max-[880px]:py-[70px] max-[880px]:px-[6%]"
      }
    >
      <div className="grid grid-cols-2 gap-[72px] items-center max-[1100px]:gap-12 max-[880px]:grid-cols-1 max-[880px]:gap-10">
        <div
          aria-hidden="true"
          className="grid grid-cols-[1.25fr_1fr] grid-rows-[1fr_1fr] gap-3.5 aspect-[5/6] w-full max-w-[580px] justify-self-center max-[880px]:aspect-[5/4] max-[880px]:max-w-[560px]"
        >
          <div className={`${tileClass} row-span-2 col-start-1`}>
            <Image src={tallImg} alt="" fill sizes="(max-width: 880px) 60vw, 30vw" placeholder="blur" />
          </div>
          <div className={`${tileClass} row-start-1 col-start-2`}>
            <Image src={sqImg} alt="" fill sizes="(max-width: 880px) 35vw, 18vw" placeholder="blur" />
          </div>
          <div className={`${tileClass} row-start-2 col-start-2`}>
            <Image src={wideImg} alt="" fill sizes="(max-width: 880px) 35vw, 18vw" placeholder="blur" />
          </div>
        </div>

        <div>
          <span className="inline-block font-sans text-[13px] font-medium tracking-[0.22em] uppercase text-pink mb-[18px]">
            Our story
          </span>
          <h2
            id="story-title"
            className="font-display text-[clamp(48px,5.5vw,72px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
          >
            Designed for the way you{" "}
            <span className="font-serif italic font-medium">shine</span>.
          </h2>
          <p className="font-serif italic text-[26px] leading-[1.4] text-blush mt-8 max-w-[600px]">
            SherryBerries was created to make piercing care and self expression feel
            beautiful — never clinical.
          </p>
          <p className="font-sans text-[17px] leading-[1.7] text-ink-dim mt-6 max-w-[600px]">
            Founder Sherry Antoine spent a decade behind the needle, frustrated by
            jewelry that looked like medical hardware and aftercare that smelled like a
            hospital. So she built the line she wished her clients could buy: studio-grade
            titanium and gold-fill pieces, healing essentials with skincare-grade
            ingredients, and a brand that treats your piercing like an act of softness,
            not a wound.
          </p>

          <Link
            href="/our-story"
            className={
              "inline-flex items-center gap-2.5 mt-8 py-4 px-7 rounded-full " +
              "bg-white/[0.04] border border-white/[0.14] backdrop-blur-[10px] text-ink " +
              "font-sans text-sm font-semibold tracking-[0.14em] uppercase no-underline " +
              "transition-[transform,border-color,background-color,gap] duration-[220ms] " +
              "hover:-translate-y-0.5 hover:border-pink hover:bg-pink/[0.08] hover:gap-4 " +
              "light:bg-[rgba(26,13,18,0.04)] light:border-[rgba(26,13,18,0.14)]"
            }
          >
            Read the full story
            <span aria-hidden="true">→</span>
          </Link>

          <div className="mt-10 flex flex-col gap-0.5">
            <span className="font-script text-[46px] leading-none text-blush tracking-[0.01em]">
              Sherry A.
            </span>
            <span className="font-sans text-[13px] font-medium tracking-[0.18em] uppercase text-ink-faint leading-[1.6]">
              Founder · Studio piercer
              <br />
              Brooklyn · Bridgetown
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
