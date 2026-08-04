import Link from "next/link";
import { Reveal } from "@/components/sizing/reveal";
import { BlockView } from "@/components/legal/legal-blocks";
import type { LegalDocument } from "@/lib/legal/types";

// The shared shell for every long-form legal page. /privacy and /terms differ
// only by the document they pass in, so the two can't drift apart visually.

const eyebrow = "font-sans text-[13px] font-medium tracking-[0.22em] uppercase text-pink";
const sectionTitle =
  "font-display text-[clamp(28px,3.2vw,42px)] leading-[1.1] tracking-[-0.01em] text-ink m-0";
/** Constrained measure — long-form legal copy stays readable. */
const measure = "max-w-[740px]";

const twoDigit = (n: number) => String(n).padStart(2, "0");

export function LegalPage({ doc }: { doc: LegalDocument }) {
  const { breadcrumb, title, titleAccent, lastUpdated, intro, sections, contact } = doc;
  const jumpLinks = [
    ...sections.map((s) => ({ id: s.id, chip: s.chip })),
    { id: contact.id, chip: contact.chip },
  ];

  return (
    <main className="pt-[120px] max-[600px]:pt-[92px]">
      {/* --- Hero --- */}
      <section className="relative px-[8%] pt-6 pb-14 max-[600px]:px-[6%] max-[600px]:pb-10">
        <div className="hero-glow" aria-hidden="true" />
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 font-sans text-[13px] text-ink-faint m-0 p-0 list-none">
            <li>
              <Link href="/" className="no-underline text-ink-faint hover:text-blush transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink-dim">{breadcrumb}</li>
          </ol>
        </nav>

        <div className="max-w-[760px] flex flex-col gap-5">
          <span className={eyebrow}>{doc.eyebrow}</span>
          <h1 className="font-display text-[clamp(42px,5.5vw,72px)] leading-[1.02] tracking-[-0.01em] text-ink m-0">
            {title} <span className="font-serif italic">{titleAccent}</span>.
          </h1>
          <p className="font-sans text-[13px] font-semibold tracking-[0.14em] uppercase text-ink-faint m-0">
            Last Updated: <span className="text-ink-dim">{lastUpdated}</span>
          </p>

          <div className={"flex flex-col gap-4 " + measure}>
            {intro.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </div>

          <nav aria-label="Jump to a section" className="mt-3">
            <ul className="flex flex-wrap gap-2.5 m-0 p-0 list-none">
              {jumpLinks.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    className="inline-flex items-center min-h-[44px] py-2 px-4 rounded-full border border-line bg-card font-sans text-[13px] font-semibold tracking-[0.04em] text-ink-dim no-underline transition-[color,border-color,background-color] duration-200 hover:text-ink hover:border-blush hover:bg-pink/[0.06]"
                  >
                    {l.chip}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* --- Document sections --- */}
      {sections.map((section, i) => (
        <section
          key={section.id}
          id={section.id}
          className={
            "scroll-mt-[120px] px-[8%] py-14 max-[600px]:px-[6%] max-[600px]:py-10 " +
            (i % 2 === 0 ? "bg-canvas-elev" : "")
          }
        >
          <Reveal className="block">
            <div className={"flex flex-col gap-3.5 mb-7 " + measure}>
              <span className={eyebrow}>
                {twoDigit(i + 1)} · {section.kicker}
              </span>
              <h2 className={sectionTitle}>{section.title}</h2>
            </div>
            <div className={"flex flex-col gap-4 " + measure}>
              {section.blocks.map((block, j) => (
                <BlockView key={j} block={block} />
              ))}
            </div>
          </Reveal>
        </section>
      ))}

      {/* --- Contact Us --- */}
      <section
        id={contact.id}
        className="scroll-mt-[120px] px-[8%] py-16 max-[600px]:px-[6%] max-[600px]:py-12"
      >
        <Reveal className="block">
          <div className="rounded-[24px] border border-line-pink bg-[linear-gradient(160deg,rgba(255,79,163,0.16),rgba(212,175,55,0.1))] p-10 flex flex-col gap-5 max-[600px]:p-7">
            <span className={eyebrow}>
              {twoDigit(sections.length + 1)} · {contact.kicker}
            </span>
            <h2 className={sectionTitle}>{contact.title}</h2>
            <p className="font-sans text-[17px] leading-[1.72] text-ink-dim m-0 max-w-[600px]">
              {contact.intro}
            </p>

            <dl className="m-0 flex flex-col gap-4">
              <ContactRow label="Email" href={`mailto:${contact.email}`} value={contact.email} />
              <ContactRow label="Website" href={contact.website} value={contact.website} external />
            </dl>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

function ContactRow({
  label,
  href,
  value,
  external = false,
}: {
  label: string;
  href: string;
  value: string;
  external?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-sans text-[12px] font-bold tracking-[0.14em] uppercase text-ink-faint">
        {label}
      </dt>
      <dd className="m-0">
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex items-center min-h-[44px] font-sans text-[17px] text-blush no-underline hover:text-pink transition-colors wrap-break-word"
        >
          {value}
        </a>
      </dd>
    </div>
  );
}
