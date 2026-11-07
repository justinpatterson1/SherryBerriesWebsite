"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminChatMessage, AdminChatSummary } from "@/lib/chat/admin-types";
import { btnOutline, cardClass, cardPadded } from "@/components/admin/shared";

// What customers asked the shopping assistant. Read-only: the useful output is
// demand ("does anyone want titanium septum rings?") and gaps in the FAQ.

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ChatPage = { chats: AdminChatSummary[]; hasMore: boolean };

/** One page of conversations, or null on any failure. */
async function fetchPage(before: string | null): Promise<ChatPage | null> {
  try {
    const res = await fetch(`/api/admin/chats${before ? `?before=${encodeURIComponent(before)}` : ""}`);
    return res.ok ? ((await res.json()) as ChatPage) : null;
  } catch {
    return null;
  }
}

export function ConversationsView() {
  const [chats, setChats] = useState<AdminChatSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<AdminChatMessage[] | null>(null);

  const applyPage = useCallback((before: string | null, data: ChatPage | null) => {
    setLoading(false);
    if (!data) {
      setError("Couldn't load conversations.");
      return;
    }
    setError(null);
    setChats((prev) => (before ? [...prev, ...data.chats] : data.chats));
    setHasMore(data.hasMore);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPage(null).then((data) => {
      if (!cancelled) applyPage(null, data);
    });
    return () => {
      cancelled = true;
    };
  }, [applyPage]);

  function loadMore() {
    const before = chats[chats.length - 1]?.updatedAt ?? null;
    setLoading(true);
    void fetchPage(before).then((data) => applyPage(before, data));
  }

  async function open(id: string) {
    setSelected(id);
    setTranscript(null);
    const res = await fetch(`/api/admin/chats?id=${encodeURIComponent(id)}`);
    if (res.ok) setTranscript(((await res.json()) as { messages: AdminChatMessage[] }).messages);
    else setTranscript([]);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={cardPadded}>
        <h2 className="font-display text-[26px] text-ink m-0">Conversations</h2>
        <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5 max-w-[620px]">
          What shoppers asked Berry, the site&apos;s assistant. Use it to spot products people
          look for that we don&apos;t carry, and questions the FAQ should answer. Guests are
          anonymous; signed-in customers show their name.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className={`${cardClass} p-2 flex flex-col`}>
          {chats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => void open(c.id)}
              className={
                "text-left w-full rounded-xl px-3.5 py-3 border cursor-pointer transition-colors " +
                (selected === c.id
                  ? "border-pink bg-pink/[0.08]"
                  : "border-transparent bg-transparent hover:bg-white/[0.04]")
              }
            >
              <div className="flex items-center justify-between gap-2 font-sans text-[11px] text-ink-faint">
                <span className="truncate">{c.customer ?? "Guest"}</span>
                <span className="shrink-0">
                  {when(c.updatedAt)} · {c.messageCount} msgs
                </span>
              </div>
              <p className="m-0 mt-1 font-sans text-[13px] text-ink line-clamp-2">
                {c.preview || "—"}
              </p>
            </button>
          ))}
          {!loading && !error && chats.length === 0 && (
            <p className="m-0 p-4 font-sans text-[13px] text-ink-faint">No conversations yet.</p>
          )}
          {error && <p className="m-0 p-4 font-sans text-[13px] text-pink">{error}</p>}
          {loading && <p className="m-0 p-4 font-sans text-[13px] text-ink-faint">Loading…</p>}
          {hasMore && !loading && (
            <button
              type="button"
              onClick={loadMore}
              className={`${btnOutline} m-2`}
            >
              Load more
            </button>
          )}
        </div>

        <div className={`${cardPadded} min-h-[300px]`}>
          {!selected && (
            <p className="m-0 font-sans text-[13px] text-ink-faint">Pick a conversation to read it.</p>
          )}
          {selected && !transcript && (
            <p className="m-0 font-sans text-[13px] text-ink-faint">Loading…</p>
          )}
          {transcript && (
            <div className="flex flex-col gap-3">
              {transcript.map((m) => (
                <div
                  key={m.id}
                  className={
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 font-sans text-[13px] leading-relaxed whitespace-pre-wrap break-words " +
                    (m.role === "user"
                      ? "self-end bg-pink/[0.14] text-ink"
                      : "self-start bg-white/[0.04] border border-white/10 text-ink-dim")
                  }
                >
                  {m.content}
                  {m.productSlugs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.productSlugs.map((s) => (
                        <Link
                          key={s}
                          href={`/products/${s}`}
                          target="_blank"
                          className="rounded-full border border-pink/40 px-2 py-0.5 text-[11px] text-blush no-underline"
                        >
                          {s}
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 text-[10px] text-ink-faint">{when(m.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
