export function ProductTrustBadges() {
  return (
    <ul className="grid grid-cols-3 gap-2 max-[520px]:grid-cols-1">
      {BADGES.map((b) => (
        <li
          key={b.title}
          className={
            "flex items-start gap-2.5 p-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] " +
            "light:bg-[rgba(26,13,18,0.025)] light:border-[rgba(26,13,18,0.08)]"
          }
        >
          <span className="text-pink mt-0.5 [&_svg]:w-4 [&_svg]:h-4">{b.icon}</span>
          <div className="flex flex-col gap-0.5">
            <span className="font-sans text-[11px] tracking-[0.14em] uppercase font-semibold text-ink">
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
    title: "Free shipping",
    body: "On orders over $80 TTD",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7h13v10H3zM16 10h4l1 3v4h-5z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="18" cy="18" r="1.6" />
      </svg>
    ),
  },
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
