"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import promoImg from "../../../assets/images/aftercare-homepage.jpg";

type Item = {
  q: string;
  a: ReactNode;
};

const ITEMS: Item[] = [
  {
    q: "Caring for a Fresh Piercing 🍓",
    a: (
      <p>
        A fresh piercing needs gentle, consistent care while it heals. Keep the area
        clean, avoid unnecessary touching or twisting your jewelry, and stay away from
        harsh products that can irritate the piercing. A simple routine using properly
        prepared non-iodized sea salt soaks can help keep your aftercare gentle and
        uncomplicated. We&rsquo;ve made keeping up with your routine easier with our
        SherryBerries piercing aftercare essentials, so you can spend less time wondering
        what to use and more time letting your piercing heal.
      </p>
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
        <p>
          Your piercing needs different care at different stages of its healing journey.
          Knowing where you are in that process helps you know when to keep things simple
          and when it&rsquo;s finally time for new jewelry. 🍓
        </p>
        <ul>
          <li>
            <strong>Fresh (0–6 weeks):</strong> Longer jewelry posts to accommodate
            swelling, consistent daily care, and safe jewelry materials such as surgical
            steel, titanium or Bioplast.
          </li>
          <li>
            <strong>Healing (6 weeks–6 months, longer for cartilage, navels and
            nipples):</strong>{" "}
            Your piercing is still healing beneath the surface, so continue with gentle
            cleaning, avoid unnecessary touching or twisting, and give it time. See the
            healing timeline below for how long each placement usually takes.
          </li>
          <li>
            <strong>Healed:</strong> The moment we&rsquo;ve been waiting for! Once your
            piercing is fully healed and ready for a jewelry change, it&rsquo;s time to
            find a piece that feels like you.{" "}
            <Link href="/products">Shop our jewelry collection →</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    q: "Signs of irritation",
    a: (
      <>
        <p>
          Some tenderness, mild redness and a small amount of clear or whitish fluid can
          be part of the normal healing process. However, increased swelling, persistent
          redness, unusual bumps, worsening pain, excessive bleeding or yellow/green
          discharge may mean your piercing needs some extra attention.
        </p>
        <p>
          If you&rsquo;re experiencing any of these concerns, contact us directly for
          guidance or visit your professional piercer for an assessment. Avoid removing or
          changing the jewelry yourself until you&rsquo;ve received appropriate guidance.
        </p>
      </>
    ),
  },
  {
    q: "Best jewelry materials",
    a: (
      <>
        <p>
          The material you wear matters, especially while your piercing is healing.
          Quality surgical steel and implant-grade titanium are commonly used options for
          healing piercings, while certain body-safe flexible materials may be appropriate
          in specific situations when recommended by a professional piercer.
        </p>
        <p>
          Be careful not to confuse gold-colored jewelry with solid gold. Many costume
          jewelry pieces are made from mixed metals such as copper or brass and may simply
          have a gold-colored or plated finish. These materials can cause irritation,
          discoloration or sensitivity, particularly in a fresh piercing.
        </p>
        <p>
          Once your piercing is fully healed, you&rsquo;ll have much more freedom to
          experiment with fashion and statement pieces. Until then, keep your jewelry
          simple, good quality and appropriate for healing. 🍓
        </p>
      </>
    ),
  },
  {
    q: "Piercing healing timeline",
    a: (
      <>
        <p>
          Earlobe piercings typically take around 6–8 weeks to heal, while nostril and
          septum piercings can take several months. Cartilage piercings should be given a
          minimum of 6 months, with some taking considerably longer depending on the
          placement and your body. Navel piercings also need at least 6 months and can
          take up to a year or longer to fully heal. Nipple piercings commonly take 6–12
          months or longer.
        </p>
        <p>
          Remember, healing happens from the outside in, so a piercing can look and feel
          healed before the inside is actually ready. Stay consistent with your aftercare,
          avoid changing your jewelry too soon, and when in doubt, check with your
          piercer. 🍓
        </p>
      </>
    ),
  },
];

const panelInnerProse =
  "pl-1 pr-1 pb-[30px] font-sans text-[21px] leading-[1.65] text-ink-dim max-w-[760px] " +
  "[&_p]:m-0 [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_ul+p]:mt-3 " +
  "[&_ul]:m-0 [&_ul]:pl-[18px] [&_ul]:list-disc " +
  "[&_li]:mt-1.5 [&_li:first-child]:mt-0 " +
  // Preflight strips a link's colour and underline, so an inline link in an
  // answer would read as plain body text without this.
  "[&_a]:text-blush [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 " +
  "[&_a]:decoration-pink/40 [&_a]:transition-colors [&_a:hover]:text-pink " +
  "[&_a:hover]:decoration-pink";

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
                    // The cap has to clear the tallest answer at phone width,
                    // where 21px body copy wraps to roughly triple the lines it
                    // takes on desktop — anything shorter silently clips.
                    (isOpen ? "max-h-[1200px]" : "max-h-0")
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
            // Not pinned: the kit copy makes this card taller than a laptop
            // viewport, and a pinned card holds its top in place, so the Shop
            // button would never scroll into view. Letting it sit in the column
            // means the box grows to its content and the page scroll reaches
            // all of it — no inner scrollbar, nothing cut off.
            "self-start rounded-[22px] p-[18px] " +
            "bg-[linear-gradient(160deg,rgba(255,79,163,0.16),rgba(212,175,55,0.1))] " +
            "border border-pink/[0.28] " +
            "shadow-[0_24px_60px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.04)_inset] " +
            "max-[1000px]:max-w-[480px]"
          }
        >
          {/* Square, matching the photo: the kit spans the full frame edge to
              edge, so a 4:5 crop would cut the sea salt jar and the tea tree
              oil — the two pieces the copy below names first and last. */}
          <div className="relative aspect-square rounded-2xl overflow-hidden">
            <Image
              src={promoImg}
              alt="The SherryBerries aftercare kit: non-iodized sea salt, saline piercing spray, Q-tips, tea tree oil and a reusable shot glass"
              fill
              sizes="(max-width: 1000px) 80vw, 36vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
          {/* Was "Free Aftercare Guide" — a 12-page emailed guide that does not
              exist, with a CTA to /aftercare-guide, which has never been a
              route. Now promotes the real aftercare range the photo shows. */}
          <h3 className="font-display text-[28px] leading-[1.1] text-ink mt-[22px] mb-2.5 mx-1">
            Aftercare Essentials
          </h3>
          <div className="font-sans text-[17px] leading-[1.6] text-ink-dim m-1 mb-6 [&_p]:m-0 [&_p+p]:mt-3">
            <p>
              Everything you need to keep your piercing-care routine simple and
              consistent. Our SherryBerries Aftercare Kit includes non-iodized sea salt,
              saline piercing spray, 100% pure tea tree oil, Q-tips and a reusable shot
              glass, thoughtfully brought together with the love, care and intention we
              put into every SherryBerries product.
            </p>
            <p>
              Whether you&rsquo;re caring for a fresh piercing or giving an irritated
              piercing some extra attention, we&rsquo;ve made it easier to have your
              piercing-care essentials together in one place.
            </p>
            <p>Care for your piercing with love &amp; intention. 🍓</p>
          </div>
          <Link
            href="/products?category=aftercare"
            className={
              "flex items-center justify-center gap-2.5 w-full py-[18px] px-6 rounded-full " +
              "bg-blush text-[#1a0d12] font-sans text-base font-bold tracking-[0.14em] uppercase no-underline " +
              "border-0 cursor-pointer " +
              "transition-[transform,box-shadow,gap] duration-[220ms] " +
              "shadow-[0_10px_24px_rgba(247,182,210,0.28)] " +
              "hover:-translate-y-0.5 hover:gap-4 hover:shadow-[0_14px_30px_rgba(247,182,210,0.4)]"
            }
          >
            Shop aftercare <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </div>
    </section>
  );
}
