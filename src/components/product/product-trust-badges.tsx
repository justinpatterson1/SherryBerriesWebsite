export function ProductTrustBadges() {
  return (
    // auto-fit rather than a fixed 3 columns: the buy-box column is only ~340px
    // between 900–1250px, and "HYPOALLERGENIC" (one unbreakable word at 0.14em
    // tracking) needs ~120px of text width, so rigid thirds overflow the card.
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

const BADGES = [
  {
    title: "Hypoallergenic",
    body: "Implant-grade titanium & 14k gold",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l8 4v5c0 4.5-3.4 8.5-8 9-4.6-.5-8-4.5-8-9V7z" />
        <path d="m8.5 12 2.5 2.5L16 9.5" />
      </svg>
    ),
  },
  {
    title: "Easy returns",
    body: "Unworn pieces within 14 days",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 14H4v5" />
        <path d="M20.5 13a8.5 8.5 0 1 1-2-7L20 8" />
      </svg>
    ),
  },
];
