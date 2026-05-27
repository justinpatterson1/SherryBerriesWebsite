export function TrustStrip() {
  return (
    <ul
      className={
        "grid grid-cols-4 gap-4 p-6 rounded-[20px] border border-white/[0.06] " +
        "bg-[linear-gradient(135deg,rgba(255,79,163,0.05),rgba(212,175,55,0.05))] " +
        "max-[900px]:grid-cols-2 list-none m-0"
      }
    >
      {ITEMS.map((it) => (
        <li key={it.label} className="flex items-center gap-3">
          <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-pink/[0.12] text-pink [&_svg]:w-[18px] [&_svg]:h-[18px] shrink-0">
            {it.icon}
          </span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-serif text-[15px] text-ink leading-tight">
              {it.label}
            </span>
            <span className="font-sans text-[11px] text-ink-faint leading-[1.45]">
              {it.body}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const ITEMS = [
  {
    label: "Free shipping",
    body: "On orders over $80 · ships from Port of Spain",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7h13v10H3zM16 10h4l1 3v4h-5z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="18" cy="18" r="1.6" />
      </svg>
    ),
  },
  {
    label: "14-day returns",
    body: "Free returns on unworn pieces",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 14H4v5" />
        <path d="M20.5 13a8.5 8.5 0 1 1-2-7L20 8" />
      </svg>
    ),
  },
  {
    label: "Hypoallergenic",
    body: "Implant-grade titanium & solid 14k gold",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l8 4v5c0 4.5-3.4 8.5-8 9-4.6-.5-8-4.5-8-9V7z" />
        <path d="m8.5 12 2.5 2.5L16 9.5" />
      </svg>
    ),
  },
  {
    label: "Pay in 4",
    body: "Interest-free with Afterpay",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h3" />
      </svg>
    ),
  },
];
