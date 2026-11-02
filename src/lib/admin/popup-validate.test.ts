import { describe, expect, it } from "vitest";
import { isSafeLink, validatePopup } from "./popup-validate";

const announcement = {
  name: "Opal preorder",
  kind: "ANNOUNCEMENT",
  headline: "The opal drop is here",
  ctaLabel: "Shop the preorder",
  productId: "prod_1",
};

const newsletter = { name: "Checkout list", kind: "NEWSLETTER", headline: "Join the Berry List" };

function error(raw: Record<string, unknown>) {
  const res = validatePopup(raw);
  return res.ok ? null : res.error;
}

describe("validatePopup", () => {
  it("accepts an announcement and fills in defaults", () => {
    const res = validatePopup(announcement);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data).toMatchObject({
      layout: "IMAGE_TEXT",
      placement: "SITE",
      frequency: "ONCE",
      delaySeconds: 2,
      priority: 0,
      active: true,
      showCountdown: false,
    });
  });

  it("requires a name, a kind and a headline", () => {
    expect(error({ ...announcement, name: " " })).toMatch(/name/i);
    expect(error({ ...announcement, kind: "BANNER" })).toMatch(/what the popup is for/);
    expect(error({ ...announcement, headline: "" })).toMatch(/headline/i);
  });

  it("asks for an image description rather than a headline on a full graphic", () => {
    expect(
      error({ ...announcement, layout: "FULL_GRAPHIC", imageUrl: "https://x.test/a.png", headline: "" }),
    ).toMatch(/Describe the graphic/);
  });

  it("requires the graphic on a full-graphic popup", () => {
    expect(error({ ...announcement, layout: "FULL_GRAPHIC" })).toMatch(/needs its graphic/);
  });

  it("pairs button text with a destination", () => {
    expect(error({ ...announcement, productId: null })).toMatch(/Choose a product or paste a link/);
    expect(error({ ...announcement, ctaLabel: "" })).toMatch(/button text/);
    expect(validatePopup({ ...announcement, ctaLabel: "", productId: "" }).ok).toBe(true);
  });

  it("drops a custom link when a product is chosen", () => {
    const res = validatePopup({ ...announcement, ctaUrl: "/products" });
    expect(res.ok && res.data.ctaUrl).toBe(null);
  });

  it("refuses unsafe links", () => {
    expect(error({ ...announcement, productId: null, ctaUrl: "javascript:alert(1)" })).toMatch(
      /Links must be/,
    );
  });

  it("strips announcement-only and newsletter-only fields from the other kind", () => {
    const n = validatePopup({ ...newsletter, ctaLabel: "Go", productId: "p", promoCodeId: "promo_1" });
    expect(n.ok && n.data).toMatchObject({ ctaLabel: null, productId: null, promoCodeId: "promo_1" });
    const a = validatePopup({ ...announcement, promoCodeId: "promo_1" });
    expect(a.ok && a.data.promoCodeId).toBe(null);
  });

  it("checks the schedule", () => {
    expect(
      error({ ...announcement, startsAt: "2026-11-10T00:00:00Z", endsAt: "2026-11-09T00:00:00Z" }),
    ).toMatch(/after the start/);
    expect(error({ ...announcement, endsAt: "not a date" })).toMatch(/end date isn't valid/);
    expect(error({ ...announcement, showCountdown: true })).toMatch(/end date for the countdown/);
    const res = validatePopup({ ...announcement, showCountdown: true, endsAt: "2026-11-20T22:00:00.000Z" });
    expect(res.ok && res.data.endsAt).toBe("2026-11-20T22:00:00.000Z");
  });

  it("bounds the delay and priority", () => {
    expect(error({ ...announcement, delaySeconds: 31 })).toMatch(/Delay/);
    expect(error({ ...announcement, delaySeconds: 1.5 })).toMatch(/Delay/);
    expect(error({ ...announcement, priority: -1 })).toMatch(/Priority/);
  });
});

describe("isSafeLink", () => {
  it("allows site paths and https", () => {
    expect(isSafeLink("/products?category=nipple")).toBe(true);
    expect(isSafeLink("https://instagram.com/sherryberries")).toBe(true);
  });

  it("refuses protocol-relative, http and script links", () => {
    expect(isSafeLink("//evil.test")).toBe(false);
    expect(isSafeLink("/\\evil.test")).toBe(false);
    expect(isSafeLink("http://example.com")).toBe(false);
    expect(isSafeLink("javascript:alert(1)")).toBe(false);
  });
});
