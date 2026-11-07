"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { ChatProductCard } from "@/lib/chat/catalog";
import { MAX_MESSAGE_LENGTH, type ChatEvent } from "@/lib/chat/request";

// The storefront shopping assistant: a floating button that opens a chat panel
// (a full-height sheet on phones). Talks to /api/chat, which streams NDJSON.

type Msg = {
  role: "user" | "assistant";
  text: string;
  cards: ChatProductCard[];
  error?: boolean;
};

const STORAGE_KEY = "sb-chat";
const GREETING =
  "Hi, I'm Berry 🍓 I can help you find jewelry, pick the right size, or answer aftercare and delivery questions.";
const STARTERS = ["Find me a piece", "What size do I need?", "Aftercare tips", "Delivery & payment"];

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || null;

type Saved = { anonId: string; conversationId: string | null; messages: Msg[] };

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (raw && typeof raw.anonId === "string" && Array.isArray(raw.messages)) return raw as Saved;
  } catch {
    // Storage blocked or corrupt: start fresh.
  }
  return { anonId: `a_${crypto.randomUUID().replace(/-/g, "")}`, conversationId: null, messages: [] };
}

function persist(s: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, messages: s.messages.slice(-30) }));
  } catch {
    // Not fatal: the chat just won't survive a reload.
  }
}

function isExcluded(pathname: string | null) {
  return !pathname || pathname.startsWith("/admin") || pathname.startsWith("/checkout");
}

function handoffHref(messages: Msg[]): string {
  const lastQuestion = [...messages].reverse().find((m) => m.role === "user")?.text;
  const text = lastQuestion
    ? `Hi SherryBerries! I was chatting with Berry on your website about: "${lastQuestion.slice(0, 300)}"`
    : "Hi SherryBerries! I have a question.";
  return WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}` : "/contact";
}

/** **bold**, "- " bullets and on-site paths (/learn/sizing) — all the formatting replies use. */
function renderText(text: string): ReactNode {
  return text.split("\n").map((line, i) => {
    const bullet = /^\s*[-*•]\s+/.test(line);
    const body = line.replace(/^\s*[-*•]\s+/, "");
    const parts = body.split(/(\*\*[^*]+\*\*|(?<![\w/])\/[a-z0-9][a-z0-9/-]*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={j} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
      if (/^\/[a-z0-9]/.test(part))
        return (
          <Link key={j} href={part} className="text-pink underline underline-offset-2">
            {part}
          </Link>
        );
      return part;
    });
    return (
      <span key={i} className={bullet ? "block pl-4 relative" : "block min-h-[0.75em]"}>
        {bullet && <span className="absolute left-1 text-pink">•</span>}
        {parts}
      </span>
    );
  });
}

function ProductCards({ cards }: { cards: ChatProductCard[] }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
      {cards.map((c) => (
        <Link
          key={c.slug}
          href={`/products/${c.slug}`}
          className="snap-start shrink-0 w-[132px] rounded-2xl overflow-hidden border border-line bg-card no-underline hover:border-pink/60 transition-colors"
        >
          <div className="relative aspect-square bg-canvas-2">
            {c.imageUrl && (
              <Image src={c.imageUrl} alt={c.name} fill sizes="132px" className="object-cover" />
            )}
            {c.isPreorder && (
              <span className="absolute top-1.5 left-1.5 rounded-full bg-gold text-black text-[9px] font-bold tracking-wider uppercase px-2 py-0.5">
                Preorder
              </span>
            )}
          </div>
          <div className="p-2">
            <p className="m-0 text-[12px] leading-tight text-ink line-clamp-2">{c.name}</p>
            <p className="m-0 mt-1 text-[12px] font-semibold text-blush">
              ${c.price.toFixed(2)}
              {c.compareAtPrice && (
                <span className="ml-1.5 font-normal text-ink-faint line-through">
                  ${c.compareAtPrice.toFixed(2)}
                </span>
              )}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<Saved | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (state) persist(state);
  }, [state]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [state?.messages, open]);
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // A tap anywhere outside the panel closes it (on phones the panel fills the screen).
    const onPointer = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (isExcluded(pathname)) return null;
  const messages = state?.messages ?? [];

  // Storage is read on first open, not during render, so server and client
  // markup match and visitors who never open the chat never touch storage.
  function openChat() {
    setState((s) => s ?? load());
    setOpen(true);
  }

  function patchLast(fn: (m: Msg) => Msg) {
    setState((s) => {
      if (!s) return s;
      const msgs = s.messages.slice();
      msgs[msgs.length - 1] = fn(msgs[msgs.length - 1]!);
      return { ...s, messages: msgs };
    });
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy || !state) return;
    setInput("");
    setBusy(true);
    setState({
      ...state,
      messages: [
        ...messages,
        { role: "user", text: message, cards: [] },
        { role: "assistant", text: "", cards: [] },
      ],
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonId: state.anonId, conversationId: state.conversationId, message }),
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Something went wrong. Please try again.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line) as ChatEvent;
          if (e.type === "meta")
            setState((s) => (s ? { ...s, conversationId: e.conversationId } : s));
          else if (e.type === "text") patchLast((m) => ({ ...m, text: m.text + e.text }));
          else if (e.type === "products") patchLast((m) => ({ ...m, cards: [...m.cards, ...e.cards] }));
          else if (e.type === "error")
            patchLast((m) => ({ ...m, text: m.text || e.message, error: !m.text }));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      patchLast((m) => ({ ...m, text: m.text || msg, error: !m.text }));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function reset() {
    setState((s) => (s ? { ...s, conversationId: null, messages: [] } : s));
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={openChat}
          aria-label="Chat with Berry, our shopping assistant"
          className="fixed bottom-5 right-5 z-[60] grid place-items-center size-14 rounded-full border-0 cursor-pointer bg-gradient-to-br from-pink to-pink-deep text-white shadow-[0_10px_30px_-6px_var(--color-pink-glow)] hover:scale-105 active:scale-95 transition-transform"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
          </svg>
        </button>
      )}

      {open && (
        <section
          ref={panelRef}
          role="dialog"
          aria-label="Shopping assistant"
          className="fixed z-[60] inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[380px] sm:h-[600px] sm:max-h-[calc(100dvh-40px)] flex flex-col sm:rounded-3xl overflow-hidden border border-line-pink bg-canvas-elev/95 backdrop-blur-xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] motion-safe:animate-[popupIn_260ms_cubic-bezier(0.2,0.8,0.2,1)]"
        >
          <header className="flex items-center gap-3 px-4 py-3 border-b border-line">
            <div className="grid place-items-center size-9 rounded-full bg-gradient-to-br from-pink to-pink-deep text-white text-lg">
              🍓
            </div>
            <div className="flex-1 min-w-0">
              <p className="m-0 font-serif text-[17px] text-ink leading-tight">Berry</p>
              <p className="m-0 text-[11px] text-ink-faint tracking-wide">SherryBerries shopping assistant</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                disabled={busy}
                className="text-[11px] text-ink-faint hover:text-pink bg-transparent border-0 cursor-pointer uppercase tracking-[0.12em] disabled:opacity-40"
              >
                New chat
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid place-items-center size-8 rounded-full bg-transparent border-0 cursor-pointer text-ink-dim hover:text-ink hover:bg-canvas-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" aria-live="polite">
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-canvas-2 border border-line px-3.5 py-2.5 text-[14px] leading-relaxed text-ink-dim">
              {GREETING}
            </div>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-line-pink bg-pink/[0.08] text-blush text-[12px] px-3 py-1.5 cursor-pointer hover:bg-pink/[0.16]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div
                  key={i}
                  className="self-end max-w-[85%] rounded-2xl rounded-tr-md bg-gradient-to-br from-pink to-pink-deep text-white px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words"
                >
                  {m.text}
                </div>
              ) : (
                <div key={i} className="flex flex-col gap-2 max-w-[92%]">
                  {(m.text || (busy && i === messages.length - 1)) && (
                    <div
                      className={
                        "rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-[14px] leading-relaxed break-words " +
                        (m.error ? "border-pink/40 bg-pink/[0.06] text-ink" : "border-line bg-canvas-2 text-ink-dim")
                      }
                    >
                      {m.text ? (
                        renderText(m.text)
                      ) : (
                        <span className="inline-flex gap-1" aria-label="Berry is typing">
                          {[0, 150, 300].map((d) => (
                            <span key={d} className="size-1.5 rounded-full bg-pink/70 animate-pulse" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </span>
                      )}
                    </div>
                  )}
                  {m.cards.length > 0 && <ProductCards cards={m.cards} />}
                </div>
              ),
            )}
          </div>

          <div className="px-3 pt-2 border-t border-line flex flex-col gap-2 pb-[max(12px,env(safe-area-inset-bottom))]">
            <a
              href={handoffHref(messages)}
              target={WHATSAPP ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="self-center text-[11px] text-ink-faint hover:text-pink no-underline tracking-wide"
            >
              Prefer a person?{" "}
              <span className="underline underline-offset-2">
                {WHATSAPP ? "Chat on WhatsApp" : "Chat with the team"}
              </span>
            </a>
            <form onSubmit={onSubmit} className="flex items-end gap-2 rounded-2xl border border-line bg-canvas px-3 py-2 focus-within:border-pink/60">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Ask Berry anything…"
                aria-label="Message"
                className="flex-1 resize-none bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:shadow-none text-[16px] sm:text-[14px] text-ink placeholder:text-ink-faint max-h-28 py-1"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="grid place-items-center size-9 shrink-0 rounded-full border-0 cursor-pointer bg-gradient-to-br from-pink to-pink-deep text-white disabled:opacity-40 disabled:cursor-default"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
