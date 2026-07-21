import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/sizing/reveal";
import { SizingFaq } from "@/components/sizing/sizing-faq";
import {
  GAUGES,
  MATERIALS,
  PLACEMENTS,
  SIZE_CHIPS,
  STEPS,
  TIER_LABEL,
  type MaterialTier,
} from "@/lib/sizing/data";

export const metadata: Metadata = {
  title: "Jewelry Sizing Guide | SherryBerries",
  description:
    "How piercing jewelry is measured — gauge, diameter, and length — with recommended sizes for every placement and which materials are safe for fresh vs. healed piercings.",
};

const JUMP_LINKS = [
  { href: "#gauge", label: "Gauge" },
  { href: "#size", label: "Size" },
  { href: "#placements", label: "By placement" },
  { href: "#measure", label: "Measure at home" },
  { href: "#materials", label: "Materials" },
  { href: "#faq", label: "FAQ" },
];

const MAX_THICKNESS = 2.4;

const TIER_STYLE: Record<MaterialTier, { chip: string; ring: string; dot: string }> = {
  fresh: {
    chip: "text-[#5fd29a] bg-[rgba(95,210,154,0.12)] border-[rgba(95,210,154,0.3)]",
    ring: "border-[rgba(95,210,154,0.35)]",
    dot: "bg-[#5fd29a]",
  },
  healed: {
    chip: "text-gold-soft bg-[rgba(232,200,121,0.12)] border-[rgba(232,200,121,0.3)]",
    ring: "border-[rgba(232,200,121,0.32)]",
    dot: "bg-gold-soft",
  },
  avoid: {
    chip: "text-[#ff8d8d] bg-[rgba(255,141,141,0.12)] border-[rgba(255,141,141,0.3)]",
    ring: "border-[rgba(255,141,141,0.32)]",
    dot: "bg-[#ff8d8d]",
  },
};

const eyebrow = "font-sans text-[13px] font-medium tracking-[0.22em] uppercase text-pink";
const sectionTitle =
  "font-display text-[clamp(30px,3.6vw,46px)] leading-[1.08] tracking-[-0.01em] text-ink m-0";
const cardBase =
  "rounded-[18px] border border-line bg-card p-6 transition-[transform,border-color,box-shadow] duration-200 " +
  "hover:-translate-y-0.5 hover:border-line-pink hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)]";

export default function SizingGuidePage() {
  return (
    <main className="pt-[120px] max-[600px]:pt-[92px]">
      {/* --- Hero --- */}
      <section className="relative px-[8%] pt-6 pb-16 max-[600px]:px-[6%] max-[600px]:pb-12">
        <div className="hero-glow" aria-hidden="true" />
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 font-sans text-[13px] text-ink-faint m-0 p-0 list-none">
            <li>
              <Link href="/" className="no-underline text-ink-faint hover:text-blush transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink-dim">Sizing Guide</li>
          </ol>
        </nav>

        <div className="max-w-[760px] flex flex-col gap-5">
          <span className={eyebrow}>Learn · Fit &amp; Sizing</span>
          <h1 className="font-display text-[clamp(42px,5.5vw,72px)] leading-[1.02] tracking-[-0.01em] text-ink m-0">
            Find your perfect{" "}
            <span className="font-serif italic">fit</span>.
          </h1>
          <p className="font-sans text-[19px] leading-[1.65] text-ink-dim m-0 max-w-[620px]">
            Body jewelry is measured in gauge, diameter, and length — and the right size changes
            with each piercing. Here&apos;s everything you need to order with confidence.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-2">
            {JUMP_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="inline-flex items-center py-2 px-4 rounded-full border border-line bg-card font-sans text-[13px] font-semibold tracking-[0.04em] text-ink-dim no-underline transition-[color,border-color,background-color] duration-200 hover:text-ink hover:border-blush hover:bg-pink/[0.06]"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* --- Section 1: Gauge --- */}
      <section id="gauge" className="scroll-mt-[120px] px-[8%] py-16 max-[600px]:px-[6%] max-[600px]:py-12">
        <Reveal className="block">
          <div className="max-w-[720px] flex flex-col gap-3.5 mb-10">
            <span className={eyebrow}>01 · Thickness</span>
            <h2 className={sectionTitle}>Gauge</h2>
            <p className="font-sans text-[18px] leading-[1.65] text-ink-dim m-0">
              Gauge is the thickness of the bar. The scale is counter-intuitive:{" "}
              <strong className="text-ink">a higher number means a thinner bar</strong>. Most
              piercings live between 20G and 14G.
            </p>
          </div>
        </Reveal>

        <Reveal className="block">
          {/* Visual bar scale */}
          <div className="rounded-[18px] border border-line bg-card p-6 mb-8 flex flex-col gap-3">
            {GAUGES.map((g) => (
              <div key={g.gauge} className="grid grid-cols-[52px_1fr_84px] items-center gap-4 max-[600px]:grid-cols-[46px_1fr]">
                <span className="font-serif text-[18px] text-ink">{g.gauge}</span>
                <span className="relative h-3.5 rounded-full bg-white/[0.05] light:bg-[rgba(26,13,18,0.06)] overflow-hidden">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink to-pink-deep"
                    style={{ width: `${(g.thickness / MAX_THICKNESS) * 100}%` }}
                  />
                </span>
                <span className="font-sans text-[13px] text-ink-faint text-right max-[600px]:hidden">
                  {g.mm}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="block">
          {/* Conversion table — real table on desktop, stacked labeled rows on mobile */}
          <div className="rounded-[18px] border border-line bg-card overflow-hidden">
            <table className="w-full border-collapse font-sans text-[15px] max-[720px]:hidden">
              <thead>
                <tr className="text-left">
                  {["Gauge", "Millimeters", "Inches", "Common uses"].map((h) => (
                    <th
                      key={h}
                      className="py-4 px-6 font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-ink-faint border-b border-line"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GAUGES.map((g) => (
                  <tr key={g.gauge} className="border-b border-line last:border-0">
                    <td className="py-4 px-6 font-serif text-[17px] text-ink">{g.gauge}</td>
                    <td className="py-4 px-6 text-ink-dim">{g.mm}</td>
                    <td className="py-4 px-6 text-ink-dim">{g.inch}</td>
                    <td className="py-4 px-6 text-ink-dim">{g.uses}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile stacked cards */}
            <div className="hidden max-[720px]:flex flex-col divide-y divide-line">
              {GAUGES.map((g) => (
                <div key={g.gauge} className="p-5 flex flex-col gap-2">
                  <span className="font-serif text-[20px] text-ink">{g.gauge}</span>
                  <StackRow label="Millimeters" value={g.mm} />
                  <StackRow label="Inches" value={g.inch} />
                  <StackRow label="Common uses" value={g.uses} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <p className="mt-6 font-sans text-[15px] leading-[1.6] text-ink-faint max-w-[720px]">
          <span className="text-pink font-semibold">Safety note:</span> never force a thicker gauge
          into an existing piercing. Stretching to a larger gauge should always be gradual and, ideally,
          done with a professional.
        </p>
      </section>

      {/* --- Section 2: Diameter & length --- */}
      <section id="size" className="scroll-mt-[120px] px-[8%] py-16 bg-canvas-elev max-[600px]:px-[6%] max-[600px]:py-12">
        <Reveal className="block">
          <div className="max-w-[720px] flex flex-col gap-3.5 mb-10">
            <span className={eyebrow}>02 · Diameter &amp; length</span>
            <h2 className={sectionTitle}>Measuring the size</h2>
            <p className="font-sans text-[18px] leading-[1.65] text-ink-dim m-0">
              Once you know the gauge, you need the size — and how you measure it depends on the
              style of the piece.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-6 max-[720px]:grid-cols-1">
          <Reveal className="block">
            <div className={cardBase + " h-full flex flex-col gap-5"}>
              <RingDiagram />
              <div>
                <h3 className="font-serif text-[22px] text-ink m-0 mb-1.5">Rings &amp; hoops</h3>
                <p className="font-sans text-[16px] leading-[1.6] text-ink-dim m-0">
                  Measure the <strong className="text-ink">inner diameter</strong> — the gap across
                  the inside of the ring, not the outer edge.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal className="block">
            <div className={cardBase + " h-full flex flex-col gap-5"}>
              <BarbellDiagram />
              <div>
                <h3 className="font-serif text-[22px] text-ink m-0 mb-1.5">Barbells &amp; studs</h3>
                <p className="font-sans text-[16px] leading-[1.6] text-ink-dim m-0">
                  Measure the <strong className="text-ink">wearable bar</strong> between the ends —
                  the length of post inside the piercing, not the balls or decorative tops.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="block">
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="font-sans text-[13px] font-bold tracking-[0.12em] uppercase text-ink-faint">
              Common sizes
            </span>
            {SIZE_CHIPS.map((s) => (
              <span
                key={s}
                className="inline-flex items-center py-2 px-4 rounded-full border border-line-pink bg-pink/[0.08] font-serif text-[16px] text-ink"
              >
                {s}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* --- Section 3: By placement --- */}
      <section id="placements" className="scroll-mt-[120px] px-[8%] py-16 max-[600px]:px-[6%] max-[600px]:py-12">
        <Reveal className="block">
          <div className="max-w-[720px] flex flex-col gap-3.5 mb-10">
            <span className={eyebrow}>03 · By placement</span>
            <h2 className={sectionTitle}>Size by piercing</h2>
            <p className="font-sans text-[18px] leading-[1.65] text-ink-dim m-0">
              Standard starting sizes for the most-requested placements. Fresh piercings often start
              a little longer and downsize once healed.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-4 gap-5 max-[1100px]:grid-cols-3 max-[820px]:grid-cols-2 max-[520px]:grid-cols-1">
          {PLACEMENTS.map((p) => (
            <Reveal key={p.name} className="block">
              <div className={cardBase + " h-full flex flex-col gap-3"}>
                <h3 className="font-serif text-[21px] text-ink m-0">{p.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <Spec label="Gauge" value={p.gauge} />
                  <Spec label="Size" value={p.size} />
                </div>
                <p className="font-sans text-[13px] text-ink-faint m-0">
                  <span className="font-semibold text-ink-dim">Styles:</span> {p.styles}
                </p>
                <p className="font-sans text-[14px] leading-[1.55] text-ink-dim m-0 mt-auto pt-2 border-t border-line">
                  {p.note}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --- Section 4: Measure at home --- */}
      <section id="measure" className="scroll-mt-[120px] px-[8%] py-16 bg-canvas-elev max-[600px]:px-[6%] max-[600px]:py-12">
        <Reveal className="block">
          <div className="max-w-[720px] flex flex-col gap-3.5 mb-10">
            <span className={eyebrow}>04 · At home</span>
            <h2 className={sectionTitle}>How to measure at home</h2>
            <p className="font-sans text-[18px] leading-[1.65] text-ink-dim m-0">
              All you need is a piece that already fits and a millimeter ruler.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-4 gap-5 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} className="block">
              <div className={cardBase + " h-full flex flex-col gap-3"}>
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-serif text-[20px] shadow-[0_8px_20px_rgba(255,79,163,0.34)]">
                  {i + 1}
                </span>
                <h3 className="font-serif text-[20px] text-ink m-0">{s.title}</h3>
                <p className="font-sans text-[15px] leading-[1.6] text-ink-dim m-0">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --- Section 5: Safe by material --- */}
      <section id="materials" className="scroll-mt-[120px] px-[8%] py-16 max-[600px]:px-[6%] max-[600px]:py-12">
        <Reveal className="block">
          <div className="max-w-[720px] flex flex-col gap-3.5 mb-10">
            <span className={eyebrow}>05 · Materials</span>
            <h2 className={sectionTitle}>Safe by material</h2>
            <p className="font-sans text-[18px] leading-[1.65] text-ink-dim m-0">
              What&apos;s in your jewelry matters most when a piercing is fresh. Here&apos;s what&apos;s
              safe, what waits until you&apos;re healed, and what to skip.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
          {MATERIALS.map((m) => {
            const t = TIER_STYLE[m.tier];
            return (
              <Reveal key={m.name} className="block">
                <div className={cardBase + " h-full flex flex-col gap-3 border-l-[3px] " + t.ring}>
                  <span
                    className={
                      "self-start inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full border " +
                      "font-sans text-[10px] font-bold tracking-[0.12em] uppercase " +
                      t.chip
                    }
                  >
                    <span className={"w-1.5 h-1.5 rounded-full " + t.dot} aria-hidden="true" />
                    {TIER_LABEL[m.tier]}
                  </span>
                  <h3 className="font-serif text-[21px] text-ink m-0">{m.name}</h3>
                  <p className="font-sans text-[15px] leading-[1.6] text-ink-dim m-0">{m.note}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="scroll-mt-[120px] px-[8%] py-16 bg-canvas-elev max-[600px]:px-[6%] max-[600px]:py-12">
        <Reveal className="block">
          <div className="max-w-[720px] flex flex-col gap-3.5 mb-10">
            <span className={eyebrow}>Sizing FAQ</span>
            <h2 className={sectionTitle}>Common questions</h2>
          </div>
        </Reveal>
        <SizingFaq />
      </section>

      {/* --- Closing CTA --- */}
      <section className="px-[8%] py-20 max-[600px]:px-[6%] max-[600px]:py-14">
        <Reveal className="block">
          <div className="rounded-[24px] border border-line-pink bg-[linear-gradient(160deg,rgba(255,79,163,0.16),rgba(212,175,55,0.1))] p-12 text-center flex flex-col items-center gap-5 max-[600px]:p-8">
            <h2 className="font-display text-[clamp(30px,4vw,48px)] leading-[1.08] text-ink m-0">
              Sized up and ready?
            </h2>
            <p className="font-sans text-[18px] leading-[1.6] text-ink-dim m-0 max-w-[520px]">
              Explore the collection and find your next piece — now that you know exactly what to look for.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2.5 py-[16px] px-8 rounded-full bg-blush text-[#1a0d12] font-sans text-[15px] font-bold tracking-[0.14em] uppercase no-underline transition-[transform,gap,box-shadow] duration-200 shadow-[0_10px_24px_rgba(247,182,210,0.28)] hover:-translate-y-0.5 hover:gap-4 hover:shadow-[0_14px_30px_rgba(247,182,210,0.4)]"
            >
              Shop the collection <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

// --- small helpers -----------------------------------------------------------

function StackRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-sans text-[12px] font-bold tracking-[0.1em] uppercase text-ink-faint">
        {label}
      </span>
      <span className="font-sans text-[14px] text-ink-dim text-right">{value}</span>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex flex-col gap-0.5 py-1.5 px-3 rounded-lg bg-white/[0.03] border border-line light:bg-[rgba(26,13,18,0.03)]">
      <span className="font-sans text-[9px] font-bold tracking-[0.1em] uppercase text-ink-faint">
        {label}
      </span>
      <span className="font-serif text-[15px] text-ink leading-none">{value}</span>
    </span>
  );
}

function RingDiagram() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-auto text-pink" role="img" aria-label="Ring — measure the inner diameter">
      <circle cx="100" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="10" opacity="0.85" />
      <line x1="66" y1="60" x2="134" y2="60" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
      <path d="M66 60 l8 -5 M66 60 l8 5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
      <path d="M134 60 l-8 -5 M134 60 l-8 5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
      <text x="100" y="52" textAnchor="middle" className="fill-current" fontSize="11" fontFamily="var(--font-sans)">
        inner Ø
      </text>
    </svg>
  );
}

function BarbellDiagram() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-auto text-pink" role="img" aria-label="Barbell — measure the wearable bar length">
      <line x1="55" y1="60" x2="145" y2="60" stroke="currentColor" strokeWidth="8" opacity="0.85" strokeLinecap="round" />
      <circle cx="52" cy="60" r="12" fill="currentColor" opacity="0.85" />
      <circle cx="148" cy="60" r="12" fill="currentColor" opacity="0.85" />
      <line x1="64" y1="88" x2="136" y2="88" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
      <path d="M64 88 l8 -5 M64 88 l8 5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
      <path d="M136 88 l-8 -5 M136 88 l-8 5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
      <text x="100" y="106" textAnchor="middle" className="fill-current" fontSize="11" fontFamily="var(--font-sans)">
        wearable length
      </text>
    </svg>
  );
}
