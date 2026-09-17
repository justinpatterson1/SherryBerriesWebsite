import { describe, it, expect } from "vitest";
import { cartNeedsShipping, isDigitalOnly, downloadFilename } from "./digital";

const physical = { isDigital: false };
const digital = { isDigital: true };

describe("isDigitalOnly", () => {
  it("is true only when every line is a download", () => {
    expect(isDigitalOnly([digital])).toBe(true);
    expect(isDigitalOnly([digital, digital])).toBe(true);
  });

  it("is false for a mixed or physical cart", () => {
    expect(isDigitalOnly([digital, physical])).toBe(false);
    expect(isDigitalOnly([physical])).toBe(false);
  });

  it("is false for an empty cart", () => {
    expect(isDigitalOnly([])).toBe(false);
  });
});

describe("cartNeedsShipping", () => {
  it("skips shipping only for an all-digital cart", () => {
    expect(cartNeedsShipping([digital])).toBe(false);
    expect(cartNeedsShipping([digital, digital])).toBe(false);
  });

  it("requires shipping when anything physical is present", () => {
    expect(cartNeedsShipping([physical])).toBe(true);
    expect(cartNeedsShipping([digital, physical])).toBe(true);
    expect(cartNeedsShipping([physical, digital])).toBe(true);
  });

  // Fail-closed. A cart that failed to load must not skip address validation.
  it("requires shipping for an empty cart", () => {
    expect(cartNeedsShipping([])).toBe(true);
  });
});

describe("downloadFilename", () => {
  it("keeps an ordinary name and adds one .pdf", () => {
    expect(downloadFilename("Aftercare Manual")).toBe("Aftercare Manual.pdf");
  });

  it("does not double up an extension the name already has", () => {
    expect(downloadFilename("Aftercare Manual.pdf")).toBe("Aftercare Manual.pdf");
  });

  // The value goes straight into a Content-Disposition header.
  it("strips quotes, newlines and slashes that would break the header", () => {
    const out = downloadFilename('Guide"\r\nX-Evil: 1');
    expect(out).not.toMatch(/["\r\n]/);
    expect(out).toBe("Guide X-Evil 1.pdf");
  });

  it("strips path separators", () => {
    expect(downloadFilename("../../etc/passwd")).toBe("etc passwd.pdf");
  });

  it("drops emoji and other non-ASCII", () => {
    expect(downloadFilename("SherryBerries Aftercare Manual 🍓")).toBe(
      "SherryBerries Aftercare Manual.pdf",
    );
  });

  it("caps the length", () => {
    const out = downloadFilename("x".repeat(500));
    expect(out.length).toBeLessThanOrEqual(64);
    expect(out.endsWith(".pdf")).toBe(true);
  });

  it("falls back when nothing survives", () => {
    expect(downloadFilename("🍓🍓🍓")).toBe("download.pdf");
    expect(downloadFilename("")).toBe("download.pdf");
    expect(downloadFilename("   ")).toBe("download.pdf");
  });
});
