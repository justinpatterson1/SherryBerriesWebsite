import { describe, expect, it } from "vitest";
import {
  countdownParts,
  isLive,
  pickPopup,
  popupStatus,
  shouldShowAgain,
  type PublicPopup,
} from "./schedule";

const NOW = new Date("2026-11-01T12:00:00Z").getTime();
const HOUR = 60 * 60 * 1000;
const iso = (offset: number) => new Date(NOW + offset).toISOString();

function popup(overrides: Partial<PublicPopup> = {}): PublicPopup {
  return {
    id: "a",
    kind: "ANNOUNCEMENT",
    layout: "IMAGE_TEXT",
    imageUrl: null,
    headline: "Hi",
    body: null,
    ctaLabel: null,
    ctaHref: null,
    showCountdown: false,
    startsAt: null,
    endsAt: null,
    frequency: "ONCE",
    delaySeconds: 0,
    priority: 0,
    hasReward: false,
    ...overrides,
  };
}

const none = { local: {}, session: {} };

describe("isLive", () => {
  it("is live with no dates, and between start and end", () => {
    expect(isLive(popup(), NOW)).toBe(true);
    expect(isLive(popup({ startsAt: iso(-HOUR), endsAt: iso(HOUR) }), NOW)).toBe(true);
  });

  it("is not live before the start or from the end onwards", () => {
    expect(isLive(popup({ startsAt: iso(HOUR) }), NOW)).toBe(false);
    expect(isLive(popup({ endsAt: iso(0) }), NOW)).toBe(false);
  });
});

describe("shouldShowAgain", () => {
  it("shows anything never seen", () => {
    expect(shouldShowAgain("ONCE", undefined, NOW)).toBe(true);
  });

  it("never repeats ONCE or SESSION", () => {
    expect(shouldShowAgain("ONCE", NOW - 365 * 24 * HOUR, NOW)).toBe(false);
    expect(shouldShowAgain("SESSION", NOW - HOUR, NOW)).toBe(false);
  });

  it("repeats DAILY after 24 hours", () => {
    expect(shouldShowAgain("DAILY", NOW - 23 * HOUR, NOW)).toBe(false);
    expect(shouldShowAgain("DAILY", NOW - 24 * HOUR, NOW)).toBe(true);
  });
});

describe("pickPopup", () => {
  it("prefers the highest priority, then the soonest ending", () => {
    const low = popup({ id: "low", priority: 1 });
    const high = popup({ id: "high", priority: 5, endsAt: iso(48 * HOUR) });
    const highSooner = popup({ id: "soon", priority: 5, endsAt: iso(HOUR) });
    expect(pickPopup([low, high, highSooner], NOW, none)?.id).toBe("soon");
  });

  it("skips popups already seen, checking the right store", () => {
    const once = popup({ id: "once", priority: 2 });
    const session = popup({ id: "sess", frequency: "SESSION", priority: 1 });
    expect(pickPopup([once, session], NOW, { local: { once: NOW }, session: {} })?.id).toBe("sess");
    // A SESSION popup recorded only in localStorage has not been seen this session.
    expect(pickPopup([session], NOW, { local: { sess: NOW }, session: {} })?.id).toBe("sess");
    expect(pickPopup([session], NOW, { local: {}, session: { sess: NOW } })).toBe(null);
  });

  it("returns null when nothing is live", () => {
    expect(pickPopup([popup({ endsAt: iso(-1) })], NOW, none)).toBe(null);
  });
});

describe("countdownParts", () => {
  it("splits the time left", () => {
    const end = iso(((2 * 24 + 3) * 60 + 4) * 60 * 1000 + 5000);
    expect(countdownParts(end, NOW)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it("is null once the end has passed", () => {
    expect(countdownParts(iso(0), NOW)).toBe(null);
    expect(countdownParts(iso(-1000), NOW)).toBe(null);
  });
});

describe("popupStatus", () => {
  it("reports what the storefront would do", () => {
    expect(popupStatus({ active: false, startsAt: null, endsAt: null }, NOW)).toBe("Off");
    expect(popupStatus({ active: true, startsAt: null, endsAt: iso(-1) }, NOW)).toBe("Ended");
    expect(popupStatus({ active: true, startsAt: iso(HOUR), endsAt: null }, NOW)).toBe("Scheduled");
    expect(popupStatus({ active: true, startsAt: null, endsAt: null }, NOW)).toBe("Live");
  });
});
