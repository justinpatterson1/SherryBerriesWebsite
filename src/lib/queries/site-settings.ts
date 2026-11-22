import "server-only";
import { prisma } from "@/lib/db";

export const SITE_SETTINGS_ID = "site";

export type SiteSettingsData = { seasonalEffects: boolean };

/** The owner's site-wide switches. No row yet means every default applies. */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  const row = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    select: { seasonalEffects: true },
  });
  return { seasonalEffects: row?.seasonalEffects ?? true };
}
