import { describe, it, expect } from "vitest";
import { MAX_MESSAGE_LENGTH, parseChatRequest, toModelHistory } from "./request";

const ANON = "anon_12345678";

describe("parseChatRequest", () => {
  it("accepts a valid request and trims the message", () => {
    expect(parseChatRequest({ anonId: ANON, conversationId: "ckabc12345", message: "  hi " })).toEqual({
      ok: true,
      value: { anonId: ANON, conversationId: "ckabc12345", message: "hi" },
    });
  });
  it("ignores a malformed conversation id rather than failing", () => {
    const r = parseChatRequest({ anonId: ANON, conversationId: "../x", message: "hi" });
    expect(r.ok && r.value.conversationId).toBe(null);
  });
  it("rejects missing anonId, empty and over-long messages", () => {
    expect(parseChatRequest({ message: "hi" }).ok).toBe(false);
    expect(parseChatRequest({ anonId: "x", message: "hi" }).ok).toBe(false);
    expect(parseChatRequest({ anonId: ANON, message: "   " }).ok).toBe(false);
    expect(parseChatRequest({ anonId: ANON, message: "a".repeat(MAX_MESSAGE_LENGTH + 1) }).ok).toBe(false);
    expect(parseChatRequest(null).ok).toBe(false);
  });
});

describe("toModelHistory", () => {
  const m = (role: string, content: string, productSlugs: string[] = []) => ({ role, content, productSlugs });

  it("keeps alternating turns and notes shown cards", () => {
    expect(toModelHistory([m("user", "hoops?"), m("assistant", "Here you go", ["a", "b"])])).toEqual([
      { role: "user", content: "hoops?" },
      { role: "assistant", content: "Here you go\n[Product cards shown: a, b]" },
    ]);
  });
  it("drops leading assistant rows and a trailing unanswered user turn", () => {
    expect(toModelHistory([m("assistant", "hello"), m("user", "q1"), m("assistant", "a1"), m("user", "q2")])).toEqual([
      { role: "user", content: "q1" },
      { role: "assistant", content: "a1" },
    ]);
  });
  it("merges consecutive same-role rows", () => {
    expect(toModelHistory([m("user", "a"), m("user", "b"), m("assistant", "c")])).toEqual([
      { role: "user", content: "a\n\nb" },
      { role: "assistant", content: "c" },
    ]);
  });
});
