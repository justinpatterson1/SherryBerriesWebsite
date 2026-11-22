export type Season = "christmas";

export const SEASONS: readonly Season[] = ["christmas"];

// Trinidad & Tobago is UTC-4 all year (no daylight saving), so a fixed offset
// is exact. Using the visitor's own clock instead would start Christmas early
// for someone browsing from Europe.
const TT_OFFSET_MS = -4 * 60 * 60 * 1000;

/** The season in effect at `now`, in Trinidad time, or null outside every season. */
export function seasonAt(now: Date): Season | null {
  const tt = new Date(now.getTime() + TT_OFFSET_MS);
  const month = tt.getUTCMonth(); // 0 = January
  const day = tt.getUTCDate();

  // 1 December – 6 January (Old Christmas / Epiphany), inclusive.
  if (month === 11 || (month === 0 && day <= 6)) return "christmas";
  return null;
}

/**
 * `?season=christmas` previews a season outside its dates, so the owner can see
 * the effect before it goes live. Anything else is ignored.
 */
export function previewSeason(param: string | null): Season | null {
  return SEASONS.find((s) => s === param) ?? null;
}
