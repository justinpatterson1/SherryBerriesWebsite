import { describe, expect, it } from "vitest";
import { previewSeason, seasonAt } from "./season";

// Times are written in Trinidad local time (UTC-4).
const tt = (iso: string) => new Date(`${iso}-04:00`);

describe("seasonAt", () => {
  it("starts Christmas at midnight on 1 December, Trinidad time", () => {
    expect(seasonAt(tt("2026-11-30T23:59:59"))).toBeNull();
    expect(seasonAt(tt("2026-12-01T00:00:00"))).toBe("christmas");
  });

  it("runs through 6 January and ends at midnight", () => {
    expect(seasonAt(tt("2026-12-25T12:00:00"))).toBe("christmas");
    expect(seasonAt(tt("2027-01-01T00:00:00"))).toBe("christmas");
    expect(seasonAt(tt("2027-01-06T23:59:59"))).toBe("christmas");
    expect(seasonAt(tt("2027-01-07T00:00:00"))).toBeNull();
  });

  it("uses Trinidad time, not UTC", () => {
    // 02:00 UTC on 1 Dec is still 22:00 on 30 Nov in Trinidad.
    expect(seasonAt(new Date("2026-12-01T02:00:00Z"))).toBeNull();
    // 02:00 UTC on 7 Jan is still 22:00 on 6 Jan in Trinidad.
    expect(seasonAt(new Date("2027-01-07T02:00:00Z"))).toBe("christmas");
  });

  it("is off the rest of the year", () => {
    expect(seasonAt(tt("2026-07-15T12:00:00"))).toBeNull();
    expect(seasonAt(tt("2026-02-14T12:00:00"))).toBeNull();
  });
});

describe("previewSeason", () => {
  it("accepts a known season only", () => {
    expect(previewSeason("christmas")).toBe("christmas");
    expect(previewSeason("halloween")).toBeNull();
    expect(previewSeason(null)).toBeNull();
  });
});
