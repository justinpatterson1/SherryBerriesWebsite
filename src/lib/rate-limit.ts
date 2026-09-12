import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/nextjs";

// Shared Upstash client. Absent credentials → null, and every limiter falls
// back to "fail open" (see checkRateLimit) so auth never breaks if Redis is
// unconfigured or unreachable.
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

/** True on a Vercel deployment (production or preview); absent locally. */
const isDeployed = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);

const DISABLED_MESSAGE =
  "[rate-limit] DISABLED — UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN are " +
  "not set. Every limiter is inert: sign-in, registration, password reset, contact and " +
  "newsletter accept unlimited requests, and brute-force protection on the login form is off.";

// A line in the deploy log the moment the module loads, so a misconfigured
// deployment is visible without waiting for traffic. `.env` is gitignored and
// never reaches Vercel, so local credentials say nothing about production —
// these are two separate sets of variables and only this can tell them apart.
if (!redis) {
  if (isDeployed) console.error(DISABLED_MESSAGE);
  else console.warn(`${DISABLED_MESSAGE} (expected when running locally)`);
}

// Reported from the first request rather than at module load: Sentry is
// initialised by instrumentation.ts, and a capture fired while this module is
// still being imported can land before init and be dropped silently — which is
// exactly the failure this alert exists to prevent.
let disabledReported = false;

function reportDisabledOnce() {
  if (disabledReported || !isDeployed) return;
  disabledReported = true;
  Sentry.captureMessage(DISABLED_MESSAGE, "error");
}

// A Redis outage during a traffic spike would otherwise report once per
// request. One report per instance every 5 minutes is enough to raise the
// alarm without burying the dashboard.
const OUTAGE_REPORT_INTERVAL_MS = 5 * 60 * 1000;
let lastOutageReport = 0;

function reportOutage(err: unknown) {
  const now = Date.now();
  if (now - lastOutageReport < OUTAGE_REPORT_INTERVAL_MS) return;
  lastOutageReport = now;
  Sentry.captureException(err, {
    level: "error",
    tags: { subsystem: "rate-limit" },
    extra: {
      consequence:
        "Failing open — requests are being allowed unlimited while Redis is unreachable.",
    },
  });
}

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
 *
 * Failing open is deliberate and stays. What changed is that it is no longer
 * *quiet*: both paths now raise a Sentry alert on a deployment, because an
 * unprotected site that looks completely healthy is the dangerous part.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<RateLimitResult> {
  if (!limiter) {
    reportDisabledOnce();
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (err) {
    console.error("[rate-limit] check failed — failing open:", err);
    reportOutage(err);
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
}

/**
 * Whether rate limiting is actually active in this process.
 *
 * Exported so a health check or an admin screen can answer "is the login form
 * protected right now?" without re-reading the environment.
 */
export function isRateLimitingEnabled(): boolean {
  return redis !== null;
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

/**
 * Proof-of-payment uploads: 10 per hour per customer.
 *
 * Keyed by user id rather than IP, because the endpoint is authenticated and a
 * household behind one address should not exhaust each other's budget. Generous
 * enough for a genuine retry after a rejection, tight enough that the endpoint
 * cannot be used to push files into storage in bulk.
 */
export const receiptLimiter = makeLimiter(10, "1 h", "receipt");

/**
 * Account deletion: 5 attempts per hour per user.
 *
 * The budget is spent on failed re-authentication, not on deletions — one
 * success ends the account. Keyed by user id because the endpoint is
 * authenticated and the thing being protected is a single account against
 * someone guessing at its password on an unattended browser.
 */
export const accountDeleteLimiter = makeLimiter(5, "1 h", "account-delete");
