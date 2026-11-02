// When a popup shows, and to whom. Pure so it can be unit tested and shared by
// the storefront (deciding what to open) and the admin list (status badges).

import type { PopupFrequency, PopupKind, PopupLayout } from "@/lib/admin/popup-validate";

/** What the storefront receives. Never carries the promo code itself. */
export type PublicPopup = {
  id: string;
  kind: PopupKind;
  layout: PopupLayout;
  imageUrl: string | null;
  headline: string;
  body: string | null;
  ctaLabel: string | null;
  /** Product page or custom link; null for no button. */
  ctaHref: string | null;
  showCountdown: boolean;
  /** ISO strings. */
  startsAt: string | null;
  endsAt: string | null;
  frequency: PopupFrequency;
  delaySeconds: number;
  priority: number;
  /** A code is revealed after signup — lets the form say so without leaking it. */
  hasReward: boolean;
};

type Timing = { startsAt: string | null; endsAt: string | null };

/** Popup id → when this browser last showed it (ms since epoch). */
export type SeenMap = Record<string, number>;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isLive(popup: Timing, now: number): boolean {
  if (popup.startsAt && new Date(popup.startsAt).getTime() > now) return false;
  if (popup.endsAt && new Date(popup.endsAt).getTime() <= now) return false;
  return true;
}

/**
 * Whether a popup seen at `lastSeenAt` may show again now. SESSION popups are
 * looked up in sessionStorage by the caller, so any record there means "seen".
 */
export function shouldShowAgain(
  frequency: PopupFrequency,
  lastSeenAt: number | undefined,
  now: number,
): boolean {
  if (lastSeenAt === undefined) return true;
  if (frequency === "DAILY") return now - lastSeenAt >= DAY_MS;
  return false;
}

/**
 * The one popup to open: live, not already seen under its frequency, highest
 * priority first and, on a tie, the one ending soonest — a countdown about to
 * run out is the more urgent message.
 */
export function pickPopup<P extends PublicPopup>(
  popups: P[],
  now: number,
  seen: { local: SeenMap; session: SeenMap },
): P | null {
  const candidates = popups.filter((p) => {
    if (!isLive(p, now)) return false;
    const store = p.frequency === "SESSION" ? seen.session : seen.local;
    return shouldShowAgain(p.frequency, store[p.id], now);
  });
  candidates.sort((a, b) => b.priority - a.priority || endTime(a) - endTime(b));
  return candidates[0] ?? null;
}

function endTime(p: Timing): number {
  return p.endsAt ? new Date(p.endsAt).getTime() : Infinity;
}

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };

/** Time left until `endsAt`, or null once it has passed. */
export function countdownParts(endsAt: string, now: number): CountdownParts | null {
  const left = Math.floor((new Date(endsAt).getTime() - now) / 1000);
  if (left <= 0) return null;
  return {
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
  };
}

export type PopupStatus = "Live" | "Scheduled" | "Ended" | "Off";

/** What the admin list shows: whether the storefront would show this today. */
export function popupStatus(popup: Timing & { active: boolean }, now: number): PopupStatus {
  if (!popup.active) return "Off";
  if (popup.endsAt && new Date(popup.endsAt).getTime() <= now) return "Ended";
  if (popup.startsAt && new Date(popup.startsAt).getTime() > now) return "Scheduled";
  return "Live";
}
