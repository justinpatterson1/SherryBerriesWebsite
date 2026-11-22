import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/queries/site-settings";

// Whether the owner allows seasonal effects. Fetched by the browser rather than
// read in the root layout, for the same reason as /api/popups: reading it there
// would make every page render per request. The dates themselves are checked
// in the browser (lib/seasonal/season.ts).
//
// Cached at the edge for a minute, so switching it off takes up to that long.

export async function GET() {
  const { seasonalEffects } = await getSiteSettings();
  return NextResponse.json(
    { enabled: seasonalEffects },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
