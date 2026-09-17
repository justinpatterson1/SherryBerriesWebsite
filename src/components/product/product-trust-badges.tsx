import { isFinalSale, RETURN_WINDOW_DAYS } from "@/lib/account/returns";

// The returns badge depends on what is being sold: jewelry and aftercare are
// final sale, merchandise and accessories are not. A single badge for both
// would be wrong on one of them, so it is chosen per product.
export function ProductTrustBadges({ categorySlug }: { categorySlug: string }) {
  const finalSale = isFinalSale(categorySlug);
  const BADGES = [finalSale ? FINAL_SALE_BADGE : RETURNABLE_BADGE];

  return (
    // auto-fit rather than fixed columns: the buy-box column is only ~340px
    // between 900–1250px, so rigid fractions overflow the card.
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2">
      {BADGES.map((b) => (
        <li
          key={b.title}
          className={
            "flex items-start gap-2.5 p-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] " +
            "light:bg-[rgba(26,13,18,0.025)] light:border-[rgba(26,13,18,0.08)]"
          }
        >
          <span className="text-pink mt-0.5 [&_svg]:w-4 [&_svg]:h-4">{b.icon}</span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-sans text-[11px] tracking-[0.14em] uppercase font-semibold text-ink wrap-break-word">
              {b.title}
            </span>
            <span className="font-sans text-[11px] text-ink-faint leading-[1.45]">
              {b.body}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const RETURN_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 14H4v5" />
    <path d="M20.5 13a8.5 8.5 0 1 1-2-7L20 8" />
  </svg>
);

// Jewelry and aftercare. Says plainly that the piece will not come back, while
// naming the one case that is always covered — the policy's own carve-out.
const FINAL_SALE_BADGE = {
  title: "Final sale",
  body: "No returns once shipped · faults always covered",
  icon: RETURN_ICON,
};

// Merchandise and accessories. Not "easy returns" any more — since
// change-of-mind returns were dropped, these come back only if something went
// wrong on our side. The window is now how long you have to tell us.
const RETURNABLE_BADGE = {
  title: "Returns",
  body: `Faults or wrong items · report within ${RETURN_WINDOW_DAYS} days`,
  icon: RETURN_ICON,
};
