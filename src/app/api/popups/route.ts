import { NextResponse } from "next/server";
import { getLivePopups } from "@/lib/queries/popups";

// Site-wide popups, fetched by the browser after the page loads. Served from
// here rather than read in the root layout, which would make every page —
// the prerendered homepage included — render per request.
//
// Cached at the edge for a minute: an admin edit shows up within that, and a
// popup's own end date is also enforced in the browser, so a cached response
// cannot keep an ended countdown on screen.

export async function GET() {
  const popups = await getLivePopups("SITE");
  return NextResponse.json(
    { popups },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
