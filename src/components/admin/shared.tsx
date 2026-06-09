"use client";

import type { ReactNode } from "react";
import type { AdminOrderStatus, StockStatus, Kpi } from "@/lib/queries/admin";

export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const money0 = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b || a || "♡").toUpperCase();
}

// Product thumbnail. Uses a plain <img> rather than next/image because admins
// can enter arbitrary image hosts that aren't in next.config's remotePatterns
// (which would make next/image throw at render). Fills its sized parent.
export function ProductThumb({ src, alt = "" }: { src: string | null; alt?: string }) {
  if (!src) {
    return <span className="w-full h-full grid place-items-center text-ink-faint">♡</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />;
}

// --- Surfaces ----------------------------------------------------------------

export const cardClass =
  "rounded-[18px] border border-white/[0.06] bg-card light:border-[rgba(26,13,18,0.08)]";

export function AdminCard({
  title,
  hint,
  action,
  children,
  className = "",
  bodyClassName = "p-6",
}: {
  title?: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`${cardClass} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3 border-b border-white/[0.05] light:border-[rgba(26,13,18,0.06)]">
          <div>
            {title && (
              <h2 className="font-display text-[17px] tracking-[0.01em] text-ink leading-none">
                {title}
              </h2>
            )}
            {hint && (
              <p className="mt-1.5 font-sans text-[11px] tracking-[0.04em] text-ink-faint">{hint}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

// --- Buttons -----------------------------------------------------------------

export const btnSolid =
  "inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border-0 cursor-pointer " +
  "bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[11px] font-bold tracking-[0.12em] uppercase " +
  "shadow-[0_8px_20px_rgba(255,79,163,0.34),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
  "transition-transform duration-200 hover:-translate-y-px " +
  "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0";

export const btnOutline =
  "inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full cursor-pointer " +
  "border border-white/14 bg-transparent text-ink-dim font-sans text-[11px] font-bold tracking-[0.12em] uppercase " +
  "transition-[color,border-color,background-color] duration-200 " +
  "hover:text-ink hover:border-blush hover:bg-pink/[0.06] light:border-[rgba(26,13,18,0.14)]";

export const btnGhost =
  "inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0 " +
  "font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-blush " +
  "transition-colors duration-200 hover:text-pink";

// --- KPI card ----------------------------------------------------------------

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const hasDelta = kpi.delta !== null && kpi.delta !== undefined;
  const up = (kpi.delta ?? 0) >= 0;
  return (
    <div className={`${cardClass} p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-ink-faint">
          {kpi.label}
        </span>
        {hasDelta && (
          <span
            className={
              "inline-flex items-center gap-1 py-0.5 px-2 rounded-full font-sans text-[10px] font-bold tracking-[0.04em] " +
              (up
                ? "text-[#5fd29a] bg-[rgba(95,210,154,0.12)]"
                : "text-[#ff8d8d] bg-[rgba(255,141,141,0.12)]")
            }
          >
            <span aria-hidden="true">{up ? "▲" : "▼"}</span>
            {Math.abs(kpi.delta as number)}%
          </span>
        )}
      </div>
      <div className="font-display text-[30px] leading-none text-ink">{kpi.value}</div>
      {kpi.hint && (
        <span className="font-sans text-[11px] tracking-[0.03em] text-ink-faint">{kpi.hint}</span>
      )}
    </div>
  );
}

// --- Status badges -----------------------------------------------------------

type Tone = "green" | "pink" | "gold" | "red" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  green:
    "text-[#5fd29a] bg-[rgba(95,210,154,0.12)] border-[rgba(95,210,154,0.3)] [&_.dot]:bg-[#5fd29a]",
  pink: "text-blush bg-pink/[0.12] border-pink/30 [&_.dot]:bg-pink",
  gold:
    "text-gold-soft bg-[rgba(232,200,121,0.12)] border-[rgba(232,200,121,0.3)] [&_.dot]:bg-gold-soft",
  red: "text-[#ff8d8d] bg-[rgba(255,141,141,0.12)] border-[rgba(255,141,141,0.3)] [&_.dot]:bg-[#ff8d8d]",
  neutral: "text-ink-faint bg-white/[0.05] border-white/12 [&_.dot]:bg-ink-faint",
};

const ORDER_TONE: Record<AdminOrderStatus, Tone> = {
  Pending: "neutral",
  Processing: "gold",
  Shipped: "pink",
  Delivered: "green",
  Cancelled: "red",
  Refunded: "red",
};

const STOCK_TONE: Record<StockStatus, Tone> = {
  "In stock": "green",
  "Low stock": "gold",
  "Out of stock": "red",
};

function Badge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full border " +
        "font-sans text-[10px] font-bold tracking-[0.12em] uppercase whitespace-nowrap " +
        TONE_CLASS[tone]
      }
    >
      <span className="dot w-1.5 h-1.5 rounded-full" aria-hidden="true" />
      {label}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: AdminOrderStatus }) {
  return <Badge tone={ORDER_TONE[status]} label={status} />;
}

export function StockBadge({ status }: { status: StockStatus }) {
  return <Badge tone={STOCK_TONE[status]} label={status} />;
}

// --- Stepper -----------------------------------------------------------------

export function Stepper({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  const btn =
    "w-7 h-7 grid place-items-center rounded-lg border border-white/12 text-ink-dim cursor-pointer " +
    "transition-colors duration-150 hover:text-ink hover:border-blush hover:bg-pink/[0.06] " +
    "light:border-[rgba(26,13,18,0.12)] select-none";
  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Decrease stock"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) ? Math.max(min, n) : min);
        }}
        className="w-14 h-7 text-center rounded-lg border border-white/12 bg-white/[0.03] font-sans text-[13px] text-ink outline-none focus:border-pink light:bg-white light:border-[rgba(26,13,18,0.12)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase stock"
        className={btn}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

// --- Icons -------------------------------------------------------------------

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const ICONS: Record<string, ReactNode> = {
  overview: (
    <Svg>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </Svg>
  ),
  orders: (
    <Svg>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </Svg>
  ),
  inventory: (
    <Svg>
      <path d="M3 9l9-5 9 5v6l-9 5-9-5z" />
      <path d="M3 9l9 5 9-5" />
      <path d="M12 14v6" />
    </Svg>
  ),
  analytics: (
    <Svg>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16l3-4 3 2 4-6" />
    </Svg>
  ),
  store: (
    <Svg>
      <path d="M4 9h16l-1-5H5z" />
      <path d="M4 9v11h16V9" />
      <path d="M9 20v-6h6v6" />
    </Svg>
  ),
  sun: (
    <Svg>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Svg>
  ),
  moon: (
    <Svg>
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </Svg>
  ),
  search: (
    <Svg>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </Svg>
  ),
  back: (
    <Svg>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </Svg>
  ),
  chevron: (
    <Svg>
      <path d="M9 18l6-6-6-6" />
    </Svg>
  ),
  alertOut: (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </Svg>
  ),
  alertLow: (
    <Svg>
      <path d="M12 3l9 16H3z" />
      <path d="M12 10v4M12 17h.01" />
    </Svg>
  ),
  healthy: (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </Svg>
  ),
  plus: (
    <Svg>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  ),
  edit: (
    <Svg>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  ),
  close: (
    <Svg>
      <path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  ),
};
