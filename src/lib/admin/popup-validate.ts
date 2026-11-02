// Pure validation for the popup form, shared by the admin modal and the API
// route. No I/O and no server-only imports, so it runs on both sides and is
// unit-testable — same split as promo-validate.ts.

export const POPUP_KINDS = ["ANNOUNCEMENT", "NEWSLETTER"] as const;
export const POPUP_LAYOUTS = ["IMAGE_TEXT", "FULL_GRAPHIC"] as const;
export const POPUP_PLACEMENTS = ["SITE", "CHECKOUT_COMPLETE"] as const;
export const POPUP_FREQUENCIES = ["ONCE", "SESSION", "DAILY"] as const;

export type PopupKind = (typeof POPUP_KINDS)[number];
export type PopupLayout = (typeof POPUP_LAYOUTS)[number];
export type PopupPlacement = (typeof POPUP_PLACEMENTS)[number];
export type PopupFrequency = (typeof POPUP_FREQUENCIES)[number];

export type PopupFormData = {
  name: string;
  kind: PopupKind;
  layout: PopupLayout;
  placement: PopupPlacement;
  imageUrl: string | null;
  headline: string;
  body: string | null;
  ctaLabel: string | null;
  productId: string | null;
  ctaUrl: string | null;
  showCountdown: boolean;
  promoCodeId: string | null;
  /**
   * ISO strings or null. The form converts its datetime-local inputs in the
   * browser, so the admin's own timezone is the one that counts — the server
   * runs in UTC and would read "18:00" four hours early.
   */
  startsAt: string | null;
  endsAt: string | null;
  frequency: PopupFrequency;
  delaySeconds: number;
  priority: number;
  active: boolean;
};

export const POPUP_LIMITS = {
  nameMax: 60,
  headlineMax: 120,
  bodyMax: 400,
  ctaLabelMax: 30,
  ctaUrlMax: 500,
  delayMax: 30,
  priorityMax: 100,
} as const;

export type PopupCheck = { ok: true; data: PopupFormData } | { ok: false; error: string };

export function validatePopup(raw: Record<string, unknown>): PopupCheck {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const nullable = (v: unknown) => str(v) || null;

  const name = str(raw.name);
  if (!name) return { ok: false, error: "Give the popup a name so you can find it later." };
  if (name.length > POPUP_LIMITS.nameMax) {
    return { ok: false, error: `Name must be ${POPUP_LIMITS.nameMax} characters or fewer.` };
  }

  const kind = oneOf(raw.kind, POPUP_KINDS);
  if (!kind) return { ok: false, error: "Choose what the popup is for." };
  const layout = oneOf(raw.layout, POPUP_LAYOUTS) ?? "IMAGE_TEXT";
  const placement = oneOf(raw.placement, POPUP_PLACEMENTS) ?? "SITE";
  const frequency = oneOf(raw.frequency, POPUP_FREQUENCIES) ?? "ONCE";

  const imageUrl = nullable(raw.imageUrl);
  if (layout === "FULL_GRAPHIC" && !imageUrl) {
    return { ok: false, error: "A full-graphic popup needs its graphic. Upload an image." };
  }

  const headline = str(raw.headline);
  if (!headline) {
    return {
      ok: false,
      error:
        layout === "FULL_GRAPHIC"
          ? "Describe the graphic in a few words. Screen readers read it out."
          : "Add a headline.",
    };
  }
  if (headline.length > POPUP_LIMITS.headlineMax) {
    return { ok: false, error: `Headline must be ${POPUP_LIMITS.headlineMax} characters or fewer.` };
  }

  const body = nullable(raw.body);
  if (body && body.length > POPUP_LIMITS.bodyMax) {
    return { ok: false, error: `Text must be ${POPUP_LIMITS.bodyMax} characters or fewer.` };
  }

  // A newsletter popup's button is the signup itself, so the link fields only
  // mean something on an announcement and are dropped otherwise.
  const isAnnouncement = kind === "ANNOUNCEMENT";
  const ctaLabel = isAnnouncement ? nullable(raw.ctaLabel) : null;
  const productId = isAnnouncement ? nullable(raw.productId) : null;
  // A chosen product wins, so a leftover custom link is not saved beside it.
  const ctaUrl = isAnnouncement && !productId ? nullable(raw.ctaUrl) : null;

  if (ctaLabel && ctaLabel.length > POPUP_LIMITS.ctaLabelMax) {
    return { ok: false, error: `Button text must be ${POPUP_LIMITS.ctaLabelMax} characters or fewer.` };
  }
  if (ctaUrl) {
    if (ctaUrl.length > POPUP_LIMITS.ctaUrlMax) return { ok: false, error: "That link is too long." };
    if (!isSafeLink(ctaUrl)) {
      return {
        ok: false,
        error: "Links must be a page on this site (starting with /) or start with https://.",
      };
    }
  }
  if (ctaLabel && !productId && !ctaUrl) {
    return { ok: false, error: "Choose a product or paste a link for the button." };
  }
  if (!ctaLabel && (productId || ctaUrl)) {
    return { ok: false, error: "Add the button text, e.g. “Shop the preorder”." };
  }

  const promoCodeId = kind === "NEWSLETTER" ? nullable(raw.promoCodeId) : null;

  const startsAt = optionalDate(raw.startsAt);
  const endsAt = optionalDate(raw.endsAt);
  if (startsAt === undefined) return { ok: false, error: "That start date isn't valid." };
  if (endsAt === undefined) return { ok: false, error: "That end date isn't valid." };
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    return { ok: false, error: "The end date must be after the start date." };
  }

  const showCountdown = raw.showCountdown === true;
  if (showCountdown && !endsAt) {
    return { ok: false, error: "Set an end date for the countdown to count down to." };
  }

  const delaySeconds = wholeNumber(raw.delaySeconds, 2);
  if (delaySeconds === null || delaySeconds < 0 || delaySeconds > POPUP_LIMITS.delayMax) {
    return { ok: false, error: `Delay must be a whole number from 0 to ${POPUP_LIMITS.delayMax} seconds.` };
  }

  const priority = wholeNumber(raw.priority, 0);
  if (priority === null || priority < 0 || priority > POPUP_LIMITS.priorityMax) {
    return { ok: false, error: `Priority must be a whole number from 0 to ${POPUP_LIMITS.priorityMax}.` };
  }

  return {
    ok: true,
    data: {
      name,
      kind,
      layout,
      placement,
      imageUrl,
      headline,
      body,
      ctaLabel,
      productId,
      ctaUrl,
      showCountdown,
      promoCodeId,
      startsAt,
      endsAt,
      frequency,
      delaySeconds,
      priority,
      active: raw.active !== false,
    },
  };
}

function oneOf<T extends string>(v: unknown, options: readonly T[]): T | null {
  return typeof v === "string" && (options as readonly string[]).includes(v) ? (v as T) : null;
}

/**
 * A site path or an https URL. "//evil.com" is refused: browsers read it as a
 * link to another host, which is exactly what a leading slash is meant to rule
 * out. javascript: and http: fall through to the https check and fail.
 */
export function isSafeLink(url: string): boolean {
  if (url.startsWith("/")) return !url.startsWith("//") && !url.startsWith("/\\");
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/** Null for blank, undefined for unparseable, otherwise a normalised ISO string. */
function optionalDate(v: unknown): string | null | undefined {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string") return undefined;
  const when = new Date(v);
  return Number.isNaN(when.getTime()) ? undefined : when.toISOString();
}

/** Blank falls back to the default; anything else must be a whole number. */
function wholeNumber(v: unknown, fallback: number): number | null {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) ? n : null;
}
