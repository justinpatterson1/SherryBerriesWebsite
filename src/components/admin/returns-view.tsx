"use client";

import { useMemo, useState } from "react";
import type { AdminReturn } from "@/lib/queries/admin";
import { btnOutline, btnSolid, cardClass } from "@/components/admin/shared";

// The queue for actioning customer return requests. Without this the requests
// would sit in a table nobody opens — the mistake the reviews feature made.

type Status = AdminReturn["status"];

const STATUS_STYLE: Record<Status, string> = {
  REQUESTED: "text-gold border-gold/40 bg-gold/[0.12]",
  APPROVED: "text-blush border-pink/40 bg-pink/[0.12]",
  REJECTED: "text-[#ff8d8d] border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.12)]",
  REFUNDED: "text-[#7ee0a8] border-[rgba(126,224,168,0.3)] bg-[rgba(126,224,168,0.12)]",
};

const STATUS_LABEL: Record<Status, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REFUNDED: "Refunded",
};

// Only forward moves are offered. REJECTED and REFUNDED are terminal — the API
// refuses to reopen them, so the buttons disappear rather than failing.
const NEXT_STATUSES: Record<Status, Status[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["REFUNDED", "REJECTED"],
  REJECTED: [],
  REFUNDED: [],
};

const FILTERS: { key: "open" | "all"; label: string }[] = [
  { key: "open", label: "Needs action" },
  { key: "all", label: "All" },
];

export function AdminReturnsView({
  returns,
  onUpdate,
}: {
  returns: AdminReturn[];
  onUpdate: (id: string, status: Status, resolution: string) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      filter === "open"
        ? returns.filter((r) => r.status === "REQUESTED" || r.status === "APPROVED")
        : returns,
    [returns, filter],
  );

  const openCount = returns.filter(
    (r) => r.status === "REQUESTED" || r.status === "APPROVED",
  ).length;

  const act = async (r: AdminReturn, status: Status) => {
    setBusyId(r.id);
    const ok = await onUpdate(r.id, status, draft[r.id] ?? "");
    setBusyId(null);
    if (ok) setDraft((d) => ({ ...d, [r.id]: "" }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[26px] text-ink m-0">Returns</h2>
            <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5 max-w-[560px]">
              {openCount === 0
                ? "Nothing waiting on you."
                : `${openCount} request${openCount === 1 ? "" : "s"} waiting on you.`}{" "}
              Approving does not move money — mark a request refunded once you have
              actually issued it.
            </p>
          </div>
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={filter === f.key ? btnSolid : btnOutline}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cardClass}>
        {shown.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            {filter === "open" ? "No open requests." : "No return requests yet."}
          </p>
        ) : (
          <div className="flex flex-col">
            {shown.map((r, i) => (
              <div
                key={r.id}
                className={
                  "py-5 " +
                  (i > 0 ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]" : "")
                }
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-sans text-[14px] font-semibold text-ink">
                    {r.reference}
                  </span>
                  <span
                    className={
                      "rounded-full border py-0.5 px-2.5 font-sans text-[11px] font-semibold " +
                      STATUS_STYLE[r.status]
                    }
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                  <span className="font-sans text-[12px] text-ink-faint">{r.dateLabel}</span>
                </div>

                <p className="font-sans text-[13px] text-ink-dim m-0 mt-2">
                  <span className="text-ink">{r.itemName}</span>
                  {r.variant ? ` (${r.variant})` : ""} · {r.orderNumber} ·{" "}
                  <span className="text-ink">{r.reason}</span>
                </p>
                <p className="font-sans text-[12px] text-ink-faint m-0 mt-1">
                  {r.customerName} · {r.customerEmail}
                </p>

                {r.notes && (
                  <p className="font-sans text-[13px] leading-[1.55] text-ink-dim m-0 mt-2.5 pl-3 border-l-2 border-white/12">
                    {r.notes}
                  </p>
                )}

                {r.resolution && (
                  <p className="font-sans text-[12px] leading-[1.55] text-ink-faint m-0 mt-2.5">
                    <span className="text-ink-dim">Your note:</span> {r.resolution}
                  </p>
                )}

                {NEXT_STATUSES[r.status].length > 0 && (
                  <div className="mt-3.5 flex flex-col gap-2.5 max-w-[560px]">
                    <input
                      value={draft[r.id] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                      placeholder="Note to the customer (required when rejecting)"
                      aria-label={`Note to the customer for ${r.reference}`}
                      className="w-full h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[13px] text-ink placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink light:bg-white light:border-[rgba(26,13,18,0.12)]"
                    />
                    <div className="flex flex-wrap gap-2">
                      {NEXT_STATUSES[r.status].map((next) => (
                        <button
                          key={next}
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => act(r, next)}
                          className={
                            (next === "REJECTED"
                              ? "py-2.5 px-4 rounded-full border-0 bg-[rgba(255,141,141,0.16)] text-[#ff8d8d] font-sans text-[11px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-[rgba(255,141,141,0.26)]"
                              : btnSolid) + " disabled:opacity-60 disabled:cursor-not-allowed"
                          }
                        >
                          {busyId === r.id ? "Saving…" : `Mark ${STATUS_LABEL[next].toLowerCase()}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
