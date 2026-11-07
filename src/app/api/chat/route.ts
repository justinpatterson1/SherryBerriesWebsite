import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit, chatLimiter, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { parseChatRequest, toModelHistory, type ChatEvent } from "@/lib/chat/request";
import { resolveConversation, saveChatMessage } from "@/lib/chat/persist";
import { SYSTEM_PROMPT } from "@/lib/chat/system-prompt";
import { CHAT_TOOLS, runChatTool } from "@/lib/chat/tools";

// The storefront shopping assistant. Streams newline-delimited JSON events:
//   { type: "meta", conversationId }   first, so the browser can resume later
//   { type: "text", text }             reply text as it is generated
//   { type: "products", cards }        product cards to render
//   { type: "error", message }         something went wrong; show it
//   { type: "done" }
//
// Each turn is a small tool loop: the model may search the catalog, read a
// product, and show cards before it answers. Within a turn the history is
// append-only (thinking blocks are passed back untouched); earlier turns are
// replayed from the database as plain text.

const MODEL = "claude-haiku-5-5";
const MAX_TOOL_ROUNDS = 5;
const FALLBACK =
  "Sorry, I couldn't help with that one. Tap \"Chat with the team\" and a real person will get back to you. 🍓";

export async function POST(request: Request) {
  const rl = await checkRateLimit(chatLimiter, getClientIp(request));
  if (!rl.success) return tooManyRequests(rl.reset);

  const parsed = parseChatRequest(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[chat] ANTHROPIC_API_KEY is not set");
    return NextResponse.json(
      { error: "The assistant is offline right now. Please reach out on WhatsApp." },
      { status: 503 },
    );
  }

  const session = await auth();
  const { conversationId, anonId, message } = parsed.value;
  const convo = await resolveConversation({
    conversationId,
    anonId,
    userId: session?.user?.id ?? null,
  });
  await saveChatMessage(convo.id, "user", message);

  const messages: Anthropic.MessageParam[] = [
    ...toModelHistory(convo.history),
    { role: "user", content: message },
  ];

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: ChatEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      send({ type: "meta", conversationId: convo.id });

      let reply = "";
      const shown: string[] = [];

      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const stream = client.messages.stream({
            model: MODEL,
            max_tokens: 4000,
            output_config: { effort: "low" },
            system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            tools: CHAT_TOOLS,
            messages,
            // Also cache the growing conversation, so each tool round and the
            // next turn re-read it from cache instead of paying full price.
            cache_control: { type: "ephemeral" },
          });

          let startedThisRound = false;
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              let text = event.delta.text;
              // Separate text written before a tool call from text after it.
              if (!startedThisRound && reply) text = "\n\n" + text;
              startedThisRound = true;
              reply += text;
              send({ type: "text", text });
            }
          }

          const final = await stream.finalMessage();
          if (process.env.NODE_ENV !== "production")
            console.log("[chat] usage", final.usage);

          if (final.stop_reason === "refusal") {
            if (!reply) {
              reply = FALLBACK;
              send({ type: "text", text: FALLBACK });
            }
            break;
          }
          if (final.stop_reason !== "tool_use") break;

          messages.push({ role: "assistant", content: final.content });
          const calls = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );
          const outcomes = await Promise.all(
            calls.map((c) =>
              runChatTool(c.name, c.input).catch((err) => {
                console.error(`[chat] tool ${c.name} failed`, err);
                return { content: "Tool failed. Try again or answer without it.", isError: true };
              }),
            ),
          );

          const results: Anthropic.ToolResultBlockParam[] = calls.map((c, i) => {
            const o = outcomes[i]!;
            if ("cards" in o && o.cards?.length) {
              send({ type: "products", cards: o.cards });
              shown.push(...o.cards.map((card) => card.slug));
            }
            return { type: "tool_result", tool_use_id: c.id, content: o.content, is_error: o.isError };
          });
          messages.push({ role: "user", content: results });
        }

        if (!reply.trim()) {
          reply = shown.length ? "Here's what I found for you 🍓" : FALLBACK;
          send({ type: "text", text: reply });
        }
      } catch (err) {
        console.error("[chat] request failed", err);
        const msg =
          err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError
            ? "I'm a little busy right now. Please try again in a moment."
            : FALLBACK;
        send({ type: "error", message: msg });
        reply ||= msg;
      }

      try {
        await saveChatMessage(convo.id, "assistant", reply, [...new Set(shown)]);
      } catch (err) {
        console.error("[chat] could not save reply", err);
      }
      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
