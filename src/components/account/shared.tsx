"use client";

import type { ReactNode } from "react";

export type View =
  | "dashboard"
  | "orders"
  | "order-detail"
  | "returns"
  | "addresses"
  | "profile"
  | "security";

export type ReturnStatus =
  | "Pending Review"
  | "Approved"
  | "Rejected"
  | "In Transit"
  | "Completed";

export type ReturnRequest = {
  id: string;
  orderId: string;
  orderNumber: string;
  product: string;
  reason: string;
  notes: string;
  status: ReturnStatus;
  date: string; // "Mar 12, 2024"
};

export const RETURN_REASONS = [
  "Wrong Item Received",
  "Damaged Item",
  "Defective Item",
  "Changed Mind",
  "Other",
] as const;

export const money = (n: number) => `$${n.toFixed(2)}`;

export function initials(firstName: string, lastName: string): string {
  const a = firstName.trim()[0] ?? "";
  const b = lastName.trim()[0] ?? "";
  return (a + b || a || "♡").toUpperCase();
}

// Status → badge palette. Covers both order display statuses and return statuses.
type Tone = "green" | "pink" | "gold" | "red" | "neutral";

const TONE_OF: Record<string, Tone> = {
  Delivered: "green",
  Approved: "green",
  Completed: "green",
  Shipped: "pink",
  "In Transit": "pink",
  Processing: "gold",
  "Pending Review": "gold",
  Cancelled: "red",
  Rejected: "red",
};

const TONE_CLASS: Record<Tone, string> = {
  green:
    "text-[#5fd29a] bg-[rgba(95,210,154,0.12)] border-[rgba(95,210,154,0.3)] [&_.dot]:bg-[#5fd29a]",
  pink: "text-blush bg-pink/[0.12] border-pink/30 [&_.dot]:bg-pink",
  gold:
    "text-gold-soft bg-[rgba(232,200,121,0.12)] border-[rgba(232,200,121,0.3)] [&_.dot]:bg-gold-soft",
  red: "text-[#ff8d8d] bg-[rgba(255,141,141,0.12)] border-[rgba(255,141,141,0.3)] [&_.dot]:bg-[#ff8d8d]",
  neutral:
    "text-ink-faint bg-white/[0.05] border-white/12 [&_.dot]:bg-ink-faint",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE_OF[status] ?? "neutral";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full border " +
        "font-sans text-[10px] font-bold tracking-[0.12em] uppercase whitespace-nowrap " +
        TONE_CLASS[tone]
      }
    >
      <span className="dot w-1.5 h-1.5 rounded-full" aria-hidden="true" />
      {status}
    </span>
  );
}

// --- Shared button classes (mini actions across views) ----------------------

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
  "hover:text-ink hover:border-blush hover:bg-pink/[0.06] " +
  "light:border-[rgba(26,13,18,0.14)]";

export const btnGhost =
  "inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0 " +
  "font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-blush " +
  "transition-colors duration-200 hover:text-pink";

// Card surface used by most panels.
export const cardClass =
  "rounded-[18px] border border-white/[0.06] bg-card p-6 " +
  "light:border-[rgba(26,13,18,0.08)]";

// --- Thin-stroke icons ------------------------------------------------------

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
  dashboard: (
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
  returns: (
    <Svg>
      <path d="M3 7v6h6" />
      <path d="M3.5 13a9 9 0 1 0 2.5-8.5L3 7" />
    </Svg>
  ),
  addresses: (
    <Svg>
      <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  ),
  profile: (
    <Svg>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  ),
  security: (
    <Svg>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1.5" />
    </Svg>
  ),
  signout: (
    <Svg>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </Svg>
  ),
};
