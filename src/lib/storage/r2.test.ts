import { describe, expect, it } from "vitest";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
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
