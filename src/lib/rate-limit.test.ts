import { describe, expect, it } from "vitest";
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
  // cost is that limiting silently does nothing when Upstash is unconfigured,
  // which is why production has to set UPSTASH_* — nothing else will tell you.
  it("fails open when no limiter is configured", async () => {
    await expect(checkRateLimit(null, "1.2.3.4")).resolves.toMatchObject({ success: true });
  });
});
