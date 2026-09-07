import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/sizing/reveal";
import ownerImg from "../../../assets/images/owner.jpg";

// The page behind the homepage's "Read the full story" button, which pointed at
// /our-story before this existed. The copy is the owner's own, laid out along
// the seams already in it — origin, belief, place, what we stand for, sign-off
// — and not reworded. Anything added here should be checked with her first.

export const metadata: Metadata = {
  title: "Our Story | SherryBerries",
  description:
    "How SherryBerries grew from a love of cute, affordable body jewelry into a Trinidad-born brand built around piercing aftercare, education and support for every Sweet Berry.",
};

const eyebrow = "font-sans text-[13px] font-medium tracking-[0.22em] uppercase text-pink";
const sectionTitle =
  "font-display text-[clamp(30px,3.6vw,46px)] leading-[1.08] tracking-[-0.01em] text-ink m-0";
const body = "font-sans text-[clamp(18px,1.45vw,23px)] leading-[1.85] text-ink-dim m-0";

/** The four values, as the copy lists them. */
const VALUES = [
  {
    title: "Self-expression",
    note: "Pieces that feel like you, not like medical hardware.",
  },
  {
    title: "Self-love",
    note: "Caring for your piercings is a way of caring for yourself.",
  },
  {
    title: "Good piercing care",
    note: "Aftercare, education and honest answers — not guesswork.",
  },
  {
    title: "Somewhere you belong",
    note: "Making sure every Sweet Berry feels welcome.",
  },
];

export default function OurStoryPage() {
  return (
    <main className="pt-[120px] max-[600px]:pt-[92px]">
      {/* --- Hero --- */}
      <section className="relative px-[8%] pt-6 pb-14 max-[600px]:px-[6%] max-[600px]:pb-10">
        <div className="hero-glow" aria-hidden="true" />
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 font-sans text-[13px] text-ink-faint m-0 p-0 list-none">
            <li>
              <Link
                href="/"
                className="no-underline text-ink-faint hover:text-blush transition-colors"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink-dim">Our Story</li>
          </ol>
        </nav>

        <div className="max-w-[760px] flex flex-col gap-5">
          <span className={eyebrow}>Our Story · Trinidad-born</span>
          <h1 className="font-display text-[clamp(42px,5.5vw,72px)] leading-[1.02] tracking-[-0.01em] text-ink m-0">
            Our <span className="font-serif italic">story</span>.
          </h1>
          <p className="font-serif italic text-[clamp(22px,2.1vw,32px)] leading-[1.4] text-blush m-0 max-w-[740px]">
            A love for cute, affordable body jewelry — and the simple idea that expressing
            yourself should be fun.
          </p>
        </div>
      </section>

      {/* --- Portrait + story --- */}
      <section className="px-[8%] pb-16 max-[600px]:px-[6%] max-[600px]:pb-12">
        <div className="grid grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] gap-16 items-start max-[900px]:grid-cols-1 max-[900px]:gap-10">
          <Reveal className="block">
            <div className="relative aspect-[906/1600] w-full rounded-[24px] overflow-hidden border border-line shadow-[0_30px_80px_rgba(0,0,0,0.45)] max-[900px]:max-w-[420px] max-[900px]:mx-auto">
              <Image
                src={ownerImg}
                alt="Sherry-Vanessa Nichols, founder of SherryBerries"
                fill
                sizes="(max-width: 900px) 92vw, 38vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal className="block">
            <div className="flex flex-col gap-7 max-w-[860px]">
              <p className={body}>
                SherryBerries started with a love for cute, affordable body jewelry and the
                simple idea that expressing yourself should be fun. But over the years, it
                grew into something much bigger. As we connected with more of our Sweet
                Berries, we realized that choosing the jewelry was only one part of the
                journey. There were questions about healing, piercing care, finding the right
                jewelry, dealing with irritation, and simply wanting a place where you could
                ask questions without feeling judged. That became a huge part of who
                SherryBerries is today.
              </p>
              <p className={body}>
                We believe your piercings are part of your self-expression, and caring for
                them is a form of self-love. That&apos;s why you&apos;ll find everything from
                everyday favorites and statement pieces to piercing aftercare, education and
                support right here.
              </p>
              <p className={body}>
                We&apos;re a Trinidad-born brand built with love, intention and a genuine
                connection to the people who support us. Whether you&apos;re getting your
                first piercing, adding another one to the collection, switching up your
                jewelry, or just learning how to care for the piercings you already have,
                there&apos;s a place for you here.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- What we stand for --- */}
      <section
        id="values"
        className="scroll-mt-[120px] px-[8%] py-16 max-[600px]:px-[6%] max-[600px]:py-12"
      >
        <Reveal className="block">
          <div className="max-w-[720px] flex flex-col gap-3.5 mb-10">
            <span className={eyebrow}>What we stand for</span>
            <h2 className={sectionTitle}>
              Self-expression. Self-love.{" "}
              <span className="font-serif italic">Good piercing care</span>.
            </h2>
            <p className={body}>
              And making sure every Sweet Berry feels welcome.
            </p>
          </div>
        </Reveal>

        <Reveal className="block">
          <ul className="grid grid-cols-4 gap-5 m-0 p-0 list-none max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
            {VALUES.map((v, i) => (
              <li
                key={v.title}
                className="rounded-[18px] border border-line bg-card p-6 flex flex-col gap-2.5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-line-pink hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)]"
              >
                <span className="font-serif italic text-[15px] font-semibold text-pink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-[21px] leading-[1.15] text-ink m-0">
                  {v.title}
                </h3>
                <p className="font-sans text-[14px] leading-[1.6] text-ink-dim m-0">{v.note}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="block">
          <p className={`${body} mt-12 max-w-[860px]`}>
            We want SherryBerries to be a space where you can find pieces that feel like
            you, get the information you need to care for your piercings, and shop knowing
            there&apos;s real care behind what we offer.
          </p>
        </Reveal>
      </section>

      {/* --- Sign-off --- */}
      <section className="px-[8%] pb-24 max-[600px]:px-[6%] max-[600px]:pb-16">
        <Reveal className="block">
          <div className="rounded-[24px] border border-line bg-card px-10 py-14 text-center max-[600px]:px-6 max-[600px]:py-10">
            <p className="font-serif italic text-[clamp(26px,3.4vw,40px)] leading-[1.3] text-ink m-0">
              Dear Sweet Berry,{" "}
              <span className="bg-gradient-to-r from-pink to-gold-soft bg-clip-text text-transparent">
                Welcome Home
              </span>
              .
            </p>

            <div className="flex flex-wrap justify-center gap-3.5 mt-9">
              <Link
                href="/products"
                className={
                  "inline-flex items-center gap-2.5 py-4 px-7 rounded-full no-underline " +
                  "bg-gradient-to-br from-pink to-pink-deep text-white " +
                  "font-sans text-sm font-semibold tracking-[0.14em] uppercase " +
                  "shadow-[0_8px_20px_rgba(255,79,163,0.34)] " +
                  "transition-[transform,gap] duration-[220ms] hover:-translate-y-0.5 hover:gap-4"
                }
              >
                Shop the collection
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/learn/sizing"
                className={
                  "inline-flex items-center gap-2.5 py-4 px-7 rounded-full no-underline " +
                  "bg-white/[0.04] border border-white/[0.14] backdrop-blur-[10px] text-ink " +
                  "font-sans text-sm font-semibold tracking-[0.14em] uppercase " +
                  "transition-[transform,border-color,background-color,gap] duration-[220ms] " +
                  "hover:-translate-y-0.5 hover:border-pink hover:bg-pink/[0.08] hover:gap-4 " +
                  "light:bg-[rgba(26,13,18,0.04)] light:border-[rgba(26,13,18,0.14)]"
                }
              >
                Sizing guide
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
