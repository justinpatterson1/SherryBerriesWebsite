import { describe, it, expect } from "vitest";
import { buildSystemPrompt, legalDocToText, richToText } from "./system-prompt";
import { SHIPPING_POLICY_DOC } from "@/lib/legal/shipping-policy";

describe("richToText", () => {
  it("flattens runs, keeping link targets", () => {
    expect(richToText(["See ", { b: "this" }, " and ", { href: "/x", text: "that" }])).toBe(
      "See this and that (/x)",
    );
  });
});

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt();

  it("is deterministic so it stays prompt-cacheable", () => {
    expect(buildSystemPrompt()).toBe(prompt);
  });
  it("carries the store facts the assistant must quote", () => {
    expect(prompt).toContain("16G = 1.2 mm");
    expect(prompt).toContain("Credit Card (WiPay)");
    expect(prompt).toContain("Tobago");
    expect(prompt).toContain(legalDocToText(SHIPPING_POLICY_DOC));
    expect(prompt).toContain("Never diagnose");
  });
});
