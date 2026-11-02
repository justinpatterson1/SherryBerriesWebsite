import "server-only";
import { prisma } from "@/lib/db";
import { promoState } from "@/lib/admin/promo-validate";
import { normalizeEmail } from "@/lib/newsletter/validate";
import type { PopupPlacement } from "@/lib/admin/popup-validate";
import type { PublicPopup } from "@/lib/popups/schedule";

// The storefront's view of popups: live ones only, and only the fields a
// browser needs. The promo code stays here — the newsletter route hands it out
// after a signup, so it never sits in a public response waiting to be read.

const PROMO_SELECT = { active: true, expiresAt: true, usageLimit: true, timesUsed: true } as const;

export async function getLivePopups(placement: PopupPlacement): Promise<PublicPopup[]> {
  const now = new Date();
  const rows = await prisma.popup.findMany({
    where: {
      active: true,
      placement,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    orderBy: { priority: "desc" },
    include: {
      product: { select: { slug: true, active: true } },
      promoCode: { select: PROMO_SELECT },
    },
  });

  return rows.map((p) => ({
    id: p.id,
    kind: p.kind,
    layout: p.layout,
    imageUrl: p.imageUrl,
    headline: p.headline,
    body: p.body,
    ctaLabel: p.ctaLabel,
    // A product taken off sale would 404; the button goes rather than break.
    ctaHref: p.product
      ? p.product.active
        ? `/products/${p.product.slug}`
        : null
      : p.ctaUrl,
    showCountdown: p.showCountdown,
    startsAt: p.startsAt?.toISOString() ?? null,
    endsAt: p.endsAt?.toISOString() ?? null,
    frequency: p.frequency,
    delaySeconds: p.delaySeconds,
    priority: p.priority,
    hasReward: !!p.promoCode && promoState(p.promoCode) === "Active",
  }));
}

/**
 * The code a newsletter popup rewards a signup with, or null. Checked at the
 * moment of signup, so a popup or code switched off since the page loaded
 * hands out nothing.
 */
export async function popupRewardCode(popupId: string): Promise<string | null> {
  const now = new Date();
  const popup = await prisma.popup.findFirst({
    where: {
      id: popupId,
      kind: "NEWSLETTER",
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    select: { promoCode: { select: { code: true, ...PROMO_SELECT } } },
  });
  const promo = popup?.promoCode;
  return promo && promoState(promo) === "Active" ? promo.code : null;
}

/**
 * The popup for the thank-you screen: the highest-priority one this buyer can
 * use. Newsletter popups are skipped for buyers already on the list — asking a
 * subscriber to subscribe is noise — so a lower announcement can still show.
 */
export async function getCheckoutPopup(email: string | null | undefined): Promise<PublicPopup | null> {
  const [popups, subscribed] = await Promise.all([
    getLivePopups("CHECKOUT_COMPLETE"),
    email
      ? prisma.newsletterSubscriber.findFirst({
          where: { email: normalizeEmail(email), unsubscribedAt: null },
          select: { id: true },
        })
      : null,
  ]);
  return popups.find((p) => !(p.kind === "NEWSLETTER" && subscribed)) ?? null;
}
