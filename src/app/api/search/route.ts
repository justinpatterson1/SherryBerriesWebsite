import { NextResponse } from "next/server";
import { getSearchIndex } from "@/lib/queries/search";
import {
  checkRateLimit,
  getClientIp,
  searchLimiter,
  tooManyRequests,
} from "@/lib/rate-limit";

// Public catalog snapshot for the client-side search overlay (same data already
// exposed on the listing pages). Fetched once, lazily, on first overlay open.
//
// Two layers of protection, because this hands over the entire catalog in one
// response and used to do so unmetered:
//
//  1. CDN caching — identical for every visitor, so the edge can serve it and
//     neither the function nor the database is touched on a repeat request.
//     This is the layer that actually absorbs volume.
//  2. Rate limiting — catches whoever busts the cache to scrape in a loop.
//
// The 429 from tooManyRequests() carries `Cache-Control: no-store`, so a
// rejection can never be cached and served on to everyone else.
export async function GET(request: Request) {
  const rl = await checkRateLimit(searchLimiter, getClientIp(request));
  if (!rl.success) return tooManyRequests(rl.reset);

  const index = await getSearchIndex();

  return NextResponse.json(index, {
    headers: {
      // Public: there is nothing user-specific in the payload. Five minutes of
      // freshness, then serve stale for an hour while revalidating, so a new
      // product appears quickly without every visitor paying for a query.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
