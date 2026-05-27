"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import promoImg from "../../../assets/images/aftercare.jpg";

type Item = {
  q: string;
  a: ReactNode;
};

const ITEMS: Item[] = [
  {
    q: "How to clean a fresh piercing",
    a: (
      <>
        <p>
          Twice a day, spray a sterile saline mist over the piercing and let it air-dry —
          no twisting, no soap, no peroxide. If crust forms, soften it with saline first,
          then gently wipe with a clean gauze.
        </p>
        <p>
          Avoid touching the piercing with unwashed hands, and skip pools, hot tubs, and
          oceans until the studio has cleared the site.
        </p>
      </>
    ),
  },
  {
    q: "Jewelry sizing guide",
    a: (
      <p>
        Body jewelry is measured by gauge (thickness) and length or diameter. Most fresh
        piercings start at 16G or 14G with extra length to accommodate swelling. Once
        healed, you can downsize to a shorter post for a flush, polished look. When in
        doubt, message us with your current piece&apos;s measurements.
      </p>
    ),
  },
  {
    q: "Fresh vs healed piercings",
    a: (
      <>
        <p>How you treat a piercing depends on where it is in its healing journey:</p>
        <ul>
          <li>
            <strong>Fresh (0–6 weeks):</strong> longer post, daily saline, implant-grade
            titanium only.
          </li>
          <li>
            <strong>Healing (6 weeks–6 months):</strong> still saline, but you can start
            gentler material rotations.
          </li>
          <li>
            <strong>Healed:</strong> wear what makes you glow — gold-fill, opals, dangles,
            statement pieces.
          </li>
        </ul>
      </>
    ),
  },
  {
    q: "Signs of irritation",
    a: (
      <p>
        Mild redness, clear lymph fluid, and tenderness in the first few weeks are normal.
        Watch for thick yellow or green discharge, hot/painful swelling that worsens,
        bleeding after the first week, or angry bumps. Those are signs to message us or
        visit a piercer — never try to remove the jewelry on your own.
      </p>
    ),
  },
  {
    q: "Best jewelry materials",
    a: (
      <>
        <p>
          We only stock materials safe for long-term wear: implant-grade titanium (ASTM
          F-136), solid 14k gold, niobium, and nickel-free surgical-grade options. Avoid
          plated jewelry, sterling silver, and mystery alloys in fresh piercings — they
          off-gas and prolong healing.
        </p>
      </>
    ),
  },
  {
    q: "Piercing healing timeline",
    a: (
      <p>
        Earlobes heal in 6–10 weeks. Nostrils, septums, and most cartilage piercings take
        4–9 months. Navels and nipples can take 9–12 months. Healing is not linear — you
        may feel fully healed and then have a flare-up. Stay consistent with aftercare
        and don&apos;t downsize too early.
      </p>
    ),
  },
];

const panelInnerProse =
  "pl-1 pr-1 pb-[30px] font-sans text-[21px] leading-[1.65] text-ink-dim max-w-[760px] " +
  "[&_p]:m-0 [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_ul+p]:mt-3 " +
  "[&_ul]:m-0 [&_ul]:pl-[18px] [&_ul]:list-disc " +
  "[&_li]:mt-1.5 [&_li:first-child]:mt-0";

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section
      aria-labelledby="faq-title"
      className="pt-[60px] pb-[120px] px-[8%] relative max-[600px]:pt-10 max-[600px]:pb-20 max-[600px]:px-[6%]"
    >
      <div className="flex flex-col gap-3.5 mb-14 max-w-[760px] max-[600px]:mb-9">
        <span className="font-sans text-[13px] font-medium tracking-[0.22em] uppercase text-pink">
          Learn · Piercing 101
        </span>
        <h2
          id="faq-title"
          className="font-display text-[clamp(40px,4.5vw,60px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
        >
          Everything you need to{" "}
          <span className="font-serif italic">heal happy</span>.
        </h2>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-20 items-start max-[1000px]:grid-cols-1 max-[1000px]:gap-14">
        <div className="flex flex-col border-t border-line">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            return (
              <div key={item.q} className="border-b border-line group/item">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className={
                    "w-full flex items-center justify-between gap-6 py-[30px] px-1 " +
                    "bg-transparent border-0 cursor-pointer text-left " +
                    "font-serif text-[28px] font-medium text-ink " +
                    "transition-colors duration-200 hover:text-pink " +
                    "max-[600px]:text-[22px] max-[600px]:py-6 max-[600px]:px-0.5"
                  }
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className={
                      "relative shrink-0 w-9 h-9 rounded-full inline-flex items-center justify-center " +
                      "border border-white/[0.14] bg-white/[0.03] text-ink-dim " +
                      "transition-[transform,background-color,color,border-color] duration-[360ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
                      "light:border-[rgba(26,13,18,0.14)] light:bg-[rgba(26,13,18,0.03)] " +
                      // + sign via two pseudo-elements
                      "before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 " +
                      "before:w-3 before:h-[1.5px] before:bg-current before:rounded " +
                      "after:content-[''] after:absolute after:top-1/2 after:left-1/2 " +
                      "after:w-3 after:h-[1.5px] after:bg-current after:rounded " +
                      "after:[transform:translate(-50%,-50%)_rotate(90deg)] " +
                      (isOpen
                        ? "[transform:rotate(45deg)] bg-gradient-to-br from-pink to-pink-deep !border-transparent !text-white"
                        : "")
                    }
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  className={
                    "overflow-hidden transition-[max-height] duration-[420ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
                    (isOpen ? "max-h-[500px]" : "max-h-0")
                  }
                >
                  <div className={panelInnerProse}>{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>

        <aside
          className={
            "sticky top-[100px] rounded-[22px] p-[18px] " +
            "bg-[linear-gradient(160deg,rgba(255,79,163,0.16),rgba(212,175,55,0.1))] " +
            "border border-pink/[0.28] " +
            "shadow-[0_24px_60px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.04)_inset] " +
            "max-[1000px]:static max-[1000px]:max-w-[480px]"
          }
        >
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
            <Image
              src={promoImg}
              alt="Aftercare essentials kit"
              fill
              sizes="(max-width: 1000px) 80vw, 36vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
          <h3 className="font-display text-[28px] leading-[1.1] text-ink mt-[22px] mb-2.5 mx-1">
            Free Aftercare Guide
          </h3>
          <p className="font-sans text-[17px] leading-[1.6] text-ink-dim m-1 mb-6">
            A 12-page studio-tested guide to cleaning, healing, and downsizing — emailed
            straight to your inbox.
          </p>
          <Link
            href="/aftercare-guide"
            className={
              "flex items-center justify-center gap-2.5 w-full py-[18px] px-6 rounded-full " +
              "bg-blush text-[#1a0d12] font-sans text-base font-bold tracking-[0.14em] uppercase no-underline " +
              "border-0 cursor-pointer " +
              "transition-[transform,box-shadow,gap] duration-[220ms] " +
              "shadow-[0_10px_24px_rgba(247,182,210,0.28)] " +
              "hover:-translate-y-0.5 hover:gap-4 hover:shadow-[0_14px_30px_rgba(247,182,210,0.4)]"
            }
          >
            Get yours free <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </div>
    </section>
  );
}
