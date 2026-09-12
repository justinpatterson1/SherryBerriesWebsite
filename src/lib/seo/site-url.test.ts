import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { CANONICAL_ORIGIN, absoluteUrl, isPreviewDeployment, siteUrl } from "./site-url";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

describe("siteUrl", () => {
  it("falls back to the canonical apex when unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteUrl()).toBe("https://shopsherryberries.com");
    expect(CANONICAL_ORIGIN).toBe("https://shopsherryberries.com");
  });

  it("rejects a value missing its scheme rather than emitting relative URLs", () => {
    // The exact mistake that breaks WiPay's response_url: a bare host is not a
    // URL, and concatenating it yields "www.example.com/products/x".
    process.env.NEXT_PUBLIC_SITE_URL = "www.shopsherryberries.com";
    expect(siteUrl()).toBe(CANONICAL_ORIGIN);
  });

  it("strips a trailing slash, path and query", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://shopsherryberries.com/";
    expect(siteUrl()).toBe("https://shopsherryberries.com");

    process.env.NEXT_PUBLIC_SITE_URL = "https://shopsherryberries.com/shop?x=1";
    expect(siteUrl()).toBe("https://shopsherryberries.com");
  });

  it("honours a valid override, including localhost for dev", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.shopsherryberries.com";
    expect(siteUrl()).toBe("https://www.shopsherryberries.com");

    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("rejects a non-http scheme", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "ftp://shopsherryberries.com";
    expect(siteUrl()).toBe(CANONICAL_ORIGIN);
  });
});

describe("absoluteUrl", () => {
  it("never produces a doubled slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://shopsherryberries.com/";
    expect(absoluteUrl("/products")).toBe("https://shopsherryberries.com/products");
    expect(absoluteUrl("products")).toBe("https://shopsherryberries.com/products");
  });
});

describe("isPreviewDeployment", () => {
  it("is false off-Vercel and in production", () => {
    delete process.env.VERCEL_ENV;
    expect(isPreviewDeployment()).toBe(false);

    process.env.VERCEL_ENV = "production";
    expect(isPreviewDeployment()).toBe(false);
  });

  it("is true for preview and development, and for anything unrecognized", () => {
    process.env.VERCEL_ENV = "preview";
    expect(isPreviewDeployment()).toBe(true);

    process.env.VERCEL_ENV = "development";
    expect(isPreviewDeployment()).toBe(true);

    // Fail closed: an environment we do not know about stays non-indexable.
    process.env.VERCEL_ENV = "staging";
    expect(isPreviewDeployment()).toBe(true);
  });
});
