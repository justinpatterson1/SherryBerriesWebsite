import Link from "next/link";
import type { Block, Rich } from "@/lib/legal/types";

const linkClass =
  "text-blush no-underline hover:text-pink transition-colors wrap-break-word";

/** Renders one content block of a legal document. */
export function BlockView({ block }: { block: Block }) {
  if (block.kind === "sub") {
    return <h3 className="font-serif text-[22px] text-ink m-0 mt-4 first:mt-0">{block.title}</h3>;
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
    <p className="font-sans text-[17px] leading-[1.72] text-ink-dim m-0">
      <RichText value={block.text} />
    </p>
  );
}

/** Renders an inline run of copy, keeping emphasis and links out of the data. */
export function RichText({ value }: { value: Rich }) {
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
        // Internal routes get client-side navigation; http(s) opens in a new
        // tab; anything else (mailto:, tel:) is a plain anchor.
        if (run.href.startsWith("/")) {
          return (
            <Link key={i} href={run.href} className={linkClass}>
              {run.text}
            </Link>
          );
        }
        const external = run.href.startsWith("http");
        return (
          <a
            key={i}
            href={run.href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={linkClass}
          >
            {run.text}
          </a>
        );
      })}
    </>
  );
}
