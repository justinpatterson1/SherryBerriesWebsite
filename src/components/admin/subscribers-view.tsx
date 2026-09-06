"use client";

import { useMemo, useState } from "react";
import type { AdminSubscriber } from "@/lib/queries/admin";
import { btnOutline, btnSolid, cardClass, ICONS } from "@/components/admin/shared";

// The newsletter list. Unsubscribing and deleting are deliberately separate:
// unsubscribing stops the mail but keeps the record that the address opted in
// and then opted out, which is the thing you want to be able to show later.
// Deleting is for typos and junk signups, where no such record exists.

const fieldClass =
  "w-full h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink " +
  "placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";

const PILL_SUBSCRIBED =
  "text-[#7ee0a8] border-[rgba(126,224,168,0.3)] bg-[rgba(126,224,168,0.12)]";
const PILL_UNSUBSCRIBED = "text-ink-faint border-white/12 bg-white/[0.05]";

type Filter = "all" | "subscribed" | "unsubscribed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "subscribed", label: "Subscribed" },
  { key: "unsubscribed", label: "Unsubscribed" },
];

/** "5 Sep 2026" — the date is enough here; the audit log carries the times. */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SubscribersView({
  subscribers,
  onAdd,
  onSetSubscribed,
  onDelete,
}: {
  subscribers: AdminSubscriber[];
  onAdd: (email: string) => Promise<boolean>;
  onSetSubscribed: (id: string, subscribed: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const subscribedCount = useMemo(
    () => subscribers.filter((s) => !s.unsubscribedAt).length,
    [subscribers],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subscribers.filter((s) => {
      if (filter === "subscribed" && s.unsubscribedAt) return false;
      if (filter === "unsubscribed" && !s.unsubscribedAt) return false;
      return !q || s.email.includes(q);
    });
  }, [subscribers, query, filter]);

  const add = async () => {
    if (!email.trim() || busy) return;
    setBusy(true);
    const ok = await onAdd(email);
    setBusy(false);
    if (ok) setEmail("");
  };

  const toggle = async (s: AdminSubscriber) => {
    setBusy(true);
    await onSetSubscribed(s.id, s.unsubscribedAt !== null);
    setBusy(false);
  };

  const remove = async (id: string) => {
    setBusy(true);
    await onDelete(id);
    setBusy(false);
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[26px] text-ink m-0">Newsletter</h2>
            <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5 max-w-[560px]">
              Everyone who signed up from the site, plus anyone added here.{" "}
              <strong className="text-ink">{subscribedCount}</strong> subscribed of{" "}
              {subscribers.length}. Unsubscribing stops the mail but keeps the record
              that they opted in — delete only a typo or a junk signup.
            </p>
          </div>
        </div>
      </div>

      {/* Add */}
      <div className={cardClass}>
        <label
          htmlFor="sub-add"
          className="block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5"
        >
          Add an address
        </label>
        <div className="flex flex-wrap gap-2.5">
          <input
            id="sub-add"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void add();
              }
            }}
            placeholder="name@example.com"
            className={`${fieldClass} flex-1 min-w-[240px]`}
          />
          <button type="button" onClick={add} disabled={busy || !email.trim()} className={btnSolid}>
            <span className="inline-flex items-center gap-2 [&_svg]:w-4 [&_svg]:h-4">
              {ICONS.plus} Add
            </span>
          </button>
        </div>
        <p className="font-sans text-[11px] leading-[1.6] text-ink-faint m-0 mt-2">
          Only add someone who asked to be on the list. An address that unsubscribed
          before is put back on rather than duplicated.
        </p>
      </div>

      {/* Filters + search */}
      <div className={cardClass}>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search addresses…"
            aria-label="Search addresses"
            className={`${fieldClass} flex-1 min-w-[200px]`}
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={
                  "py-2 px-3.5 rounded-full cursor-pointer font-sans text-[11px] font-bold " +
                  "tracking-[0.12em] uppercase transition-colors duration-200 border " +
                  (filter === f.key
                    ? "border-pink text-ink bg-pink/[0.12]"
                    : "border-white/12 text-ink-faint bg-transparent hover:text-ink")
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className={cardClass}>
        {shown.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            {subscribers.length === 0
              ? "Nobody has signed up yet."
              : "No addresses match that."}
          </p>
        ) : (
          <div className="flex flex-col">
            {shown.map((s, i) => {
              const active = s.unsubscribedAt === null;
              return (
                <div
                  key={s.id}
                  className={
                    "flex flex-wrap items-center gap-4 py-4 " +
                    (i > 0
                      ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]"
                      : "")
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <span className="font-sans text-[14px] text-ink break-all">
                        {s.email}
                      </span>
                      <span
                        className={
                          "py-0.5 px-2 rounded-full border font-sans text-[10px] font-bold " +
                          "tracking-[0.1em] uppercase " +
                          (active ? PILL_SUBSCRIBED : PILL_UNSUBSCRIBED)
                        }
                      >
                        {active ? "Subscribed" : "Unsubscribed"}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-ink-faint m-0 mt-1">
                      Joined {shortDate(s.subscribedAt)}
                      {s.source ? ` · via ${s.source}` : ""}
                      {s.unsubscribedAt ? ` · left ${shortDate(s.unsubscribedAt)}` : ""}
                    </p>
                  </div>

                  {confirmDelete === s.id ? (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-sans text-[12px] text-ink-dim">
                        Delete permanently?
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(s.id)}
                        disabled={busy}
                        className={btnSolid}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className={btnOutline}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggle(s)}
                        disabled={busy}
                        className={btnOutline}
                      >
                        {active ? "Unsubscribe" : "Resubscribe"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(s.id)}
                        disabled={busy}
                        className={btnOutline}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
