import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/sizing/reveal";
import {
  CONTACT,
  INTRO,
  LAST_UPDATED,
  PRIVACY_EMAIL,
  SECTIONS,
  SITE_URL,
  type Block,
  type Rich,
} from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | SherryBerries",
  description:
    "How SherryBerries collects, uses, shares, and protects your personal information — including payments, cookies, data retention, and your privacy rights.",
};

const eyebrow = "font-sans text-[13px] font-medium tracking-[0.22em] uppercase text-pink";
const sectionTitle =
  "font-display text-[clamp(28px,3.2vw,42px)] leading-[1.1] tracking-[-0.01em] text-ink m-0";
const body = "font-sans text-[17px] leading-[1.72] text-ink-dim m-0";
/** Constrained measure — long-form legal copy stays readable. */
const measure = "max-w-[740px]";

const JUMP_LINKS = [...SECTIONS.map((s) => ({ id: s.id, chip: s.chip })), { id: CONTACT.id, chip: CONTACT.chip }];

export default function PrivacyPolicyPage() {
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
            <li className="text-ink-dim">Privacy Policy</li>
          </ol>
        </nav>

        <div className="max-w-[760px] flex flex-col gap-5">
          <span className={eyebrow}>Legal · Sherry Berries Body Jewelry and Accessories</span>
          <h1 className="font-display text-[clamp(42px,5.5vw,72px)] leading-[1.02] tracking-[-0.01em] text-ink m-0">
            Privacy <span className="font-serif italic">policy</span>.
          </h1>
          <p className="font-sans text-[13px] font-semibold tracking-[0.14em] uppercase text-ink-faint m-0">
            Last Updated: <span className="text-ink-dim">{LAST_UPDATED}</span>
          </p>

          <div className={"flex flex-col gap-4 " + measure}>
            {INTRO.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </div>

          <nav aria-label="Jump to a section" className="mt-3">
            <ul className="flex flex-wrap gap-2.5 m-0 p-0 list-none">
              {JUMP_LINKS.map((l) => (
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

      {/* --- Policy sections --- */}
      {SECTIONS.map((section, i) => (
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
                {String(i + 1).padStart(2, "0")} · {section.kicker}
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
        id={CONTACT.id}
        className="scroll-mt-[120px] px-[8%] py-16 max-[600px]:px-[6%] max-[600px]:py-12"
      >
        <Reveal className="block">
          <div className="rounded-[24px] border border-line-pink bg-[linear-gradient(160deg,rgba(255,79,163,0.16),rgba(212,175,55,0.1))] p-10 flex flex-col gap-5 max-[600px]:p-7">
            <span className={eyebrow}>
              {String(SECTIONS.length + 1).padStart(2, "0")} · {CONTACT.kicker}
            </span>
            <h2 className={sectionTitle}>{CONTACT.title}</h2>
            <p className={body + " max-w-[600px]"}>{CONTACT.intro}</p>

            <dl className="m-0 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <dt className="font-sans text-[12px] font-bold tracking-[0.14em] uppercase text-ink-faint">
                  Email
                </dt>
                <dd className="m-0">
                  <a
                    href={`mailto:${PRIVACY_EMAIL}`}
                    className="inline-flex items-center min-h-[44px] font-sans text-[17px] text-blush no-underline hover:text-pink transition-colors wrap-break-word"
                  >
                    {PRIVACY_EMAIL}
                  </a>
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="font-sans text-[12px] font-bold tracking-[0.14em] uppercase text-ink-faint">
                  Website
                </dt>
                <dd className="m-0">
                  <a
                    href={SITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center min-h-[44px] font-sans text-[17px] text-blush no-underline hover:text-pink transition-colors wrap-break-word"
                  >
                    {SITE_URL}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

// --- renderers ---------------------------------------------------------------

function BlockView({ block }: { block: Block }) {
  if (block.kind === "sub") {
    return (
      <h3 className="font-serif text-[22px] text-ink m-0 mt-4 first:mt-0">{block.title}</h3>
    );
  }

  if (block.kind === "list") {
    return (
      <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
        {block.items.map((item, i) => (
          <li key={i} className="relative pl-6 font-sans text-[17px] leading-[1.72] text-ink-dim">
            <span
              className="absolute left-0 top-[0.62em] w-1.5 h-1.5 rounded-full bg-pink"
              aria-hidden="true"
            />
            <RichText value={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className={body}>
      <RichText value={block.text} />
    </p>
  );
}

function RichText({ value }: { value: Rich }) {
  if (typeof value === "string") return <>{value}</>;

  return (
    <>
      {value.map((run, i) => {
        if (typeof run === "string") return <span key={i}>{run}</span>;
        if ("b" in run) {
          return (
            <strong key={i} className="font-semibold text-ink">
              {run.b}
            </strong>
          );
        }
        const external = run.href.startsWith("http");
        return (
          <a
            key={i}
            href={run.href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="text-blush no-underline hover:text-pink transition-colors wrap-break-word"
          >
            {run.text}
          </a>
        );
      })}
    </>
  );
}
