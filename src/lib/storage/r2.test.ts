import { describe, expect, it } from "vitest";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_DIGITAL_BYTES,
  digitalAssetKey,
  isDigitalFileKey,
  productImageKey,
  validateDigitalUpload,
  validateImageUpload,
} from "./r2";

describe("validateImageUpload", () => {
  it("accepts every supported image type at a normal size", () => {
    for (const type of ACCEPTED_IMAGE_TYPES) {
      expect(validateImageUpload(type, 1024)).toEqual({ ok: true });
    }
  });

  it("accepts a file exactly at the size limit", () => {
    expect(validateImageUpload("image/png", MAX_UPLOAD_BYTES)).toEqual({ ok: true });
  });

  it("rejects an unsupported content type", () => {
    const result = validateImageUpload("application/pdf", 1024);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unsupported file type/i);
  });

  it("rejects a disguised non-image (e.g. svg)", () => {
    expect(validateImageUpload("image/svg+xml", 1024).ok).toBe(false);
  });

  it("rejects an empty file", () => {
    const result = validateImageUpload("image/jpeg", 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/empty/i);
  });

  it("rejects a file one byte over the limit", () => {
    const result = validateImageUpload("image/webp", MAX_UPLOAD_BYTES + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too large|5 MB/i);
  });

  it("checks the type before the size", () => {
    // A too-large unsupported file should report the type problem first.
    const result = validateImageUpload("text/plain", MAX_UPLOAD_BYTES + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unsupported/i);
  });
});

describe("productImageKey", () => {
  const base = "https://cdn.example.com";

  it("extracts the key from a URL this bucket wrote", () => {
    expect(productImageKey(base, `${base}/products/abc-123.webp`)).toBe("products/abc-123.webp");
  });

  it("tolerates a trailing slash on the configured base", () => {
    expect(productImageKey(`${base}/`, `${base}/products/a.png`)).toBe("products/a.png");
  });

  it("drops a query string and fragment", () => {
    expect(productImageKey(base, `${base}/products/a.png?v=2#x`)).toBe("products/a.png");
  });

  it("decodes a percent-encoded key", () => {
    expect(productImageKey(base, `${base}/products/a%20b.png`)).toBe("products/a b.png");
  });

  it("refuses a URL from another host", () => {
    expect(productImageKey(base, "https://images.other.com/products/a.png")).toBeNull();
  });

  it("refuses a lookalike host that merely starts the same", () => {
    expect(productImageKey(base, "https://cdn.example.com.evil.test/products/a.png")).toBeNull();
  });

  it("refuses anything outside the products prefix", () => {
    // Receipts live in the same bucket and must never be deletable this way.
    expect(productImageKey(base, `${base}/receipts/secret.pdf`)).toBeNull();
  });

  it("refuses a key that traverses out of the prefix", () => {
    expect(productImageKey(base, `${base}/products/../receipts/secret.pdf`)).toBeNull();
  });
});

describe("validateDigitalUpload", () => {
  it("accepts a PDF at a normal size", () => {
    expect(validateDigitalUpload("application/pdf", 68_000)).toEqual({ ok: true });
    expect(validateDigitalUpload("application/pdf", MAX_DIGITAL_BYTES)).toEqual({ ok: true });
  });

  it("accepts nothing but a PDF", () => {
    for (const type of ["image/png", "image/jpeg", "text/html", "application/zip", ""]) {
      expect(validateDigitalUpload(type, 1024).ok).toBe(false);
    }
  });

  it("rejects an empty or unmeasurable file", () => {
    expect(validateDigitalUpload("application/pdf", 0).ok).toBe(false);
    expect(validateDigitalUpload("application/pdf", -1).ok).toBe(false);
    expect(validateDigitalUpload("application/pdf", Number.NaN).ok).toBe(false);
  });

  it("rejects a file over the cap", () => {
    expect(validateDigitalUpload("application/pdf", MAX_DIGITAL_BYTES + 1).ok).toBe(false);
  });
});

describe("digitalAssetKey", () => {
  it("writes into the digital prefix with a .pdf suffix", () => {
    const key = digitalAssetKey("11111111-2222-3333-4444-555555555555");
    expect(key).toBe("digital/11111111-2222-3333-4444-555555555555.pdf");
    // Whatever it builds must be something we are willing to serve back.
    expect(isDigitalFileKey(key)).toBe(true);
  });
});

describe("isDigitalFileKey", () => {
  it("accepts a key this app generated", () => {
    expect(isDigitalFileKey("digital/11111111-2222-3333-4444-555555555555.pdf")).toBe(true);
    expect(isDigitalFileKey("digital/abc_DEF-123.pdf")).toBe(true);
  });

  // Regression guard: receipt exfiltration. digitalFileKey arrives as a plain
  // string from the admin's browser. If a payments/ key were accepted here, the
  // download route would stream another customer's bank receipt to anyone who
  // bought the product.
  it("refuses a payment receipt key", () => {
    expect(isDigitalFileKey("payments/SB-1048/secret.pdf")).toBe(false);
    expect(isDigitalFileKey("digital/../payments/SB-1048/secret.pdf")).toBe(false);
  });

  it("refuses other prefixes, other extensions and empty input", () => {
    expect(isDigitalFileKey("products/a.png")).toBe(false);
    expect(isDigitalFileKey("digital/a.exe")).toBe(false);
    expect(isDigitalFileKey("digital/nested/a.pdf")).toBe(false);
    expect(isDigitalFileKey("digital/.pdf")).toBe(false);
    expect(isDigitalFileKey("")).toBe(false);
  });

  it("refuses a full URL even when it contains the prefix", () => {
    expect(isDigitalFileKey("https://cdn.example.com/digital/a.pdf")).toBe(false);
    expect(isDigitalFileKey("/digital/a.pdf")).toBe(false);
  });
});
