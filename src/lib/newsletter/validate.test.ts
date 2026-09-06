import { describe, expect, it } from "vitest";
import { EMAIL_MAX, maskEmail, normalizeEmail, validateNewsletterEmail } from "./validate";

describe("normalizeEmail", () => {
  it("trims and lowercases so one person cannot become two rows", () => {
    expect(normalizeEmail("  Sam@Example.COM ")).toBe("sam@example.com");
    expect(normalizeEmail("sam@example.com")).toBe("sam@example.com");
  });
});

describe("validateNewsletterEmail", () => {
  it("accepts a normal address and returns it normalised", () => {
    const result = validateNewsletterEmail("  Berry@SherryBerries.com ");
    expect(result).toEqual({ ok: true, email: "berry@sherryberries.com" });
  });

  it("rejects an empty or non-string value", () => {
    expect(validateNewsletterEmail("")).toEqual({
      ok: false,
      error: "Please enter your email.",
    });
    expect(validateNewsletterEmail("   ").ok).toBe(false);
    expect(validateNewsletterEmail(undefined).ok).toBe(false);
    expect(validateNewsletterEmail(42).ok).toBe(false);
  });

  it("rejects obviously malformed addresses", () => {
    for (const bad of ["sam", "sam@", "@example.com", "sam@example", "a b@example.com"]) {
      expect(validateNewsletterEmail(bad).ok).toBe(false);
    }
  });

  it("rejects an address past the RFC length bound", () => {
    const long = `${"a".repeat(EMAIL_MAX)}@example.com`;
    expect(validateNewsletterEmail(long)).toEqual({
      ok: false,
      error: "That email is too long.",
    });
  });
});

describe("maskEmail", () => {
  it("keeps the first character and the whole domain", () => {
    expect(maskEmail("sam@example.com")).toBe("s***@example.com");
  });

  it("drops a single-character local part rather than exposing it", () => {
    expect(maskEmail("a@example.com")).toBe("***@example.com");
  });

  it("splits on the last @, so a local part containing one is not mishandled", () => {
    expect(maskEmail('"a@b"@example.com')).toBe('"***@example.com');
  });

  it("returns *** when there is no local part to keep", () => {
    expect(maskEmail("@example.com")).toBe("***");
    expect(maskEmail("not-an-email")).toBe("***");
  });
});
