import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getClientIp, retryAfterSeconds, tooManyRequests } from "./rate-limit";

describe("tooManyRequests", () => {
  it("is a 429 carrying Retry-After", () => {
    const res = tooManyRequests(Date.now() + 90_000);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  // The hazard this guards: /api/search sets `s-maxage`, so if a 429 were
  // cacheable the CDN would serve one visitor's rejection to everyone until it
  // expired — one abuser causing an outage.
  it("is never cacheable", () => {
    expect(tooManyRequests(Date.now() + 1000).headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("retryAfterSeconds", () => {
  it("rounds up to whole seconds", () => {
    expect(retryAfterSeconds(Date.now() + 4_200)).toBe(5);
  });

  it("floors at 1 for a window that already elapsed", () => {
    expect(retryAfterSeconds(Date.now() - 10_000)).toBe(1);
    expect(retryAfterSeconds(0)).toBe(1);
  });
});

describe("getClientIp", () => {
  it("takes the first hop of x-forwarded-for", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip, then to a loopback placeholder", () => {
    expect(getClientIp(new Request("https://x.test", { headers: { "x-real-ip": "198.51.100.7" } })))
      .toBe("198.51.100.7");
    expect(getClientIp(new Request("https://x.test"))).toBe("127.0.0.1");
  });
});

describe("checkRateLimit", () => {
  // Deliberate: an Upstash outage must not lock people out of signing in. The
  // cost is that limiting does nothing when Upstash is unconfigured — which is
  // why a deployment now raises a Sentry alert about it (see below).
  it("fails open when no limiter is configured", async () => {
    await expect(checkRateLimit(null, "1.2.3.4")).resolves.toMatchObject({ success: true });
  });
});

/**
 * The alerting added after the S5 audit.
 *
 * `.env` is gitignored and never reaches Vercel, so credentials being present
 * locally says nothing about production. Before this, a deployment missing
 * UPSTASH_* ran with every limiter inert and reported nothing anywhere — the
 * site looked perfectly healthy while the login form accepted unlimited
 * password guesses. These tests pin the alert that makes that state visible.
 *
 * The module reads its environment once at import, so each case stubs the
 * environment and re-imports it through `vi.resetModules()`.
 */
describe("disabled-limiter alerting", () => {
  const captureMessage = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    captureMessage.mockClear();
    vi.doMock("@sentry/nextjs", () => ({ captureMessage, captureException: vi.fn() }));
    // No credentials: this is the misconfigured-deployment case.
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@sentry/nextjs");
  });

  it("alerts Sentry on a deployment when credentials are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    const mod = await import("./rate-limit");

    await mod.checkRateLimit(null, "1.2.3.4");

    expect(captureMessage).toHaveBeenCalledTimes(1);
    const [message, level] = captureMessage.mock.calls[0]!;
    expect(level).toBe("error");
    expect(String(message)).toContain("UPSTASH_REDIS_REST_URL");
  });

  // A busy site would otherwise report on every single request.
  it("alerts only once per instance, however many requests arrive", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    const mod = await import("./rate-limit");

    for (let i = 0; i < 25; i++) await mod.checkRateLimit(null, `ip-${i}`);

    expect(captureMessage).toHaveBeenCalledTimes(1);
  });

  // Running locally without Upstash is normal and must not page anyone.
  it("stays quiet when not deployed", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
    const mod = await import("./rate-limit");

    await mod.checkRateLimit(null, "1.2.3.4");

    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("reports limiting as disabled when credentials are absent", async () => {
    const mod = await import("./rate-limit");
    expect(mod.isRateLimitingEnabled()).toBe(false);
  });

  it("reports limiting as enabled once credentials are present", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    const mod = await import("./rate-limit");
    expect(mod.isRateLimitingEnabled()).toBe(true);
  });
});
