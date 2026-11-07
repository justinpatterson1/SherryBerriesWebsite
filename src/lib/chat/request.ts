import type Anthropic from "@anthropic-ai/sdk";
import type { ChatProductCard } from "@/lib/chat/catalog";

// Pure helpers for /api/chat: validating what the browser sends and turning
// stored messages back into model history.

export const MAX_MESSAGE_LENGTH = 1000;
/** Earlier messages replayed to the model per request (user + assistant). */
export const HISTORY_LIMIT = 20;

export interface ChatRequest {
  conversationId: string | null;
  anonId: string;
  message: string;
}

export type ChatRequestCheck =
  | { ok: true; value: ChatRequest }
  | { ok: false; error: string };

const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function parseChatRequest(raw: unknown): ChatRequestCheck {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid request." };
  const o = raw as Record<string, unknown>;

  if (typeof o.anonId !== "string" || !ID_RE.test(o.anonId))
    return { ok: false, error: "Invalid request." };

  const conversationId =
    typeof o.conversationId === "string" && ID_RE.test(o.conversationId)
      ? o.conversationId
      : null;

  const message = typeof o.message === "string" ? o.message.trim() : "";
  if (!message) return { ok: false, error: "Please type a message." };
  if (message.length > MAX_MESSAGE_LENGTH)
    return {
      ok: false,
      error: `Please keep messages under ${MAX_MESSAGE_LENGTH} characters.`,
    };

  return { ok: true, value: { conversationId, anonId: o.anonId, message } };
}

export interface StoredMessage {
  role: string;
  content: string;
  productSlugs: string[];
}

/**
 * Stored rows → model messages, oldest first.
 *
 * Only visible text is stored, so earlier turns replay as plain text (no tool
 * calls or thinking blocks). Product cards the assistant showed are noted in
 * its turn so follow-ups like "the second one" still resolve. The history must
 * start with a user turn and alternate, so leading assistant rows are dropped
 * and consecutive same-role rows are merged.
 */
export function toModelHistory(rows: StoredMessage[]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  for (const r of rows) {
    if (r.role !== "user" && r.role !== "assistant") continue;
    if (!out.length && r.role !== "user") continue;
    let text = r.content;
    if (r.role === "assistant" && r.productSlugs.length)
      text += `\n[Product cards shown: ${r.productSlugs.join(", ")}]`;
    if (!text.trim()) continue;

    const last = out[out.length - 1];
    if (last && last.role === r.role) last.content = `${last.content as string}\n\n${text}`;
    else out.push({ role: r.role, content: text });
  }
  // The new user message is appended by the caller, so history must end on an
  // assistant turn (or be empty) to keep roles alternating.
  if (out.length && out[out.length - 1]!.role === "user") out.pop();
  return out;
}

/** One line of the /api/chat NDJSON stream. */
export type ChatEvent =
  | { type: "meta"; conversationId: string }
  | { type: "text"; text: string }
  | { type: "products"; cards: ChatProductCard[] }
  | { type: "error"; message: string }
  | { type: "done" };
