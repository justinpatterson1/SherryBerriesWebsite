import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Shared Upstash client. Absent credentials → null, and every limiter falls
// back to "fail open" (see checkRateLimit) so auth never breaks if Redis is
// unconfigured or unreachable.
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

type Duration = Parameters<typeof Ratelimit.slidingWindow>[1];

function makeLimiter(tokens: number, window: Duration, prefix: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `rl:${prefix}`,
    analytics: false,
  });
}

// One limiter per protected auth endpoint, configured per the spec's table.
export const authLimiters = {
  login: makeLimiter(5, "15 m", "login"),
  register: makeLimiter(3, "1 h", "register"),
  forgotPassword: makeLimiter(3, "1 h", "forgot"),
  resetPassword: makeLimiter(5, "15 m", "reset"),
  resendVerification: makeLimiter(3, "15 m", "resend"),
};

// Contact form — deter spam without blocking genuine follow-ups (per IP).
export const contactLimiter = makeLimiter(5, "1 h", "contact");

// Promo codes. /api/promo is public and unauthenticated, and it answers
// "does this code exist?" — which makes it an enumeration oracle. Our codes are
// guessable words (BERRY10, WELCOME20), so an attacker does not need a huge
// dictionary; the defence is making each guess expensive rather than hiding the
// answer, since a customer with a genuinely expired code deserves to be told so.
// A real customer types a code once or twice per order.
export const promoLimiter = makeLimiter(10, "1 h", "promo");

// Catalog search index. Fetched once per session when the overlay first opens,
// so a generous ceiling still stops someone scraping the whole catalog in a
// loop. Caching (see the route) is the first line of defence; this is the
// second.
export const searchLimiter = makeLimiter(30, "1 h", "search");

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Epoch ms when the window resets. 0 when limiting is disabled. */
  reset: number;
};

/**
 * Run a limiter for an identifier. Fails open (allows the request) when the
 * limiter is disabled (no Upstash credentials) or Redis throws, so an outage
 * never locks users out of auth.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<RateLimitResult> {
  if (!limiter) return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (err) {
    console.error("[rate-limit] check failed — failing open:", err);
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

/** Seconds until the window resets, floored at 1. */
export function retryAfterSeconds(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

/** Standard 429 JSON response with a Retry-After header. */
export function tooManyRequests(reset: number): NextResponse {
  const seconds = retryAfterSeconds(reset);
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return NextResponse.json(
    {
      error: `Too many attempts. Please try again in ${minutes} minute${
        minutes === 1 ? "" : "s"
      }.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(seconds),
        // Never let a CDN cache a 429: on a route that sets s-maxage (see
        // /api/search) a cached rejection would be served to every visitor
        // until it expired, turning one abuser into an outage.
        "Cache-Control": "no-store",
      },
    },
  );
}
