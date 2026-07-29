import { describe, expect, it } from "vitest";
import { CONTACT_LIMITS, validateContact } from "./validate";

const valid = {
  name: "Sherry V",
  email: "sherry@example.com",
  subject: "Sizing help",
  message: "Hi, I need help picking a septum size.",
};

describe("validateContact", () => {
  it("accepts a well-formed submission and trims fields", () => {
    const result = validateContact({
      name: "  Sherry V  ",
      email: "  sherry@example.com ",
      subject: " Sizing help ",
      message: "  I need help picking a size.  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Sherry V");
      expect(result.data.email).toBe("sherry@example.com");
      expect(result.data.message).toBe("I need help picking a size.");
    }
  });

  it("treats subject as optional", () => {
    expect(validateContact({ ...valid, subject: "" }).ok).toBe(true);
  });

  it("requires a name", () => {
    const r = validateContact({ ...valid, name: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/name/i);
  });

  it("rejects a malformed email", () => {
    for (const bad of ["notanemail", "a@b", "a@b.", "@x.com", "a b@x.com"]) {
      const r = validateContact({ ...valid, email: bad });
      expect(r.ok, bad).toBe(false);
    }
  });

  it("rejects a message that is too short", () => {
    const r = validateContact({ ...valid, message: "hi" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/short/i);
  });

  it("rejects an over-long message", () => {
    const r = validateContact({ ...valid, message: "x".repeat(CONTACT_LIMITS.messageMax + 1) });
    expect(r.ok).toBe(false);
  });

  it("rejects an over-long name", () => {
    const r = validateContact({ ...valid, name: "x".repeat(CONTACT_LIMITS.nameMax + 1) });
    expect(r.ok).toBe(false);
  });

  it("rejects non-string / missing fields", () => {
    expect(validateContact({}).ok).toBe(false);
    expect(validateContact({ name: 5, email: {}, message: [] }).ok).toBe(false);
  });
});
