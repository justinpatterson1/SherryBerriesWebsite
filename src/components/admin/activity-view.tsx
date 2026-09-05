"use client";

import { useMemo, useState } from "react";
import type { AdminAuditEntry } from "@/lib/queries/admin";
import { btnOutline, btnSolid, cardClass } from "@/components/admin/shared";

// SUPERADMIN-only record of every change made through the admin panel. Rows are
// written in the same transaction as the change they describe, so this is a
// complete account of what the panel did — see lib/admin/audit.ts.

const ACTION_LABEL: Record<string, string> = {
  "product.create": "Product created",
  "product.update": "Product edited",
  "inventory.update": "Price / stock",
  "category.create": "Category created",
  "category.update": "Category edited",
  "category.delete": "Category deleted",
  "order.status_change": "Order status",
  "return.status_change": "Return status",
  "image.upload": "Image uploaded",
};

// Destructive or money-adjacent actions are tinted so they stand out in a long
// list; everything else stays neutral.
const ACTION_STYLE: Record<string, string> = {
  "category.delete":
    "text-[#ff8d8d] border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.12)]",
  "order.status_change": "text-blush border-pink/40 bg-pink/[0.12]",
  "return.status_change": "text-blush border-pink/40 bg-pink/[0.12]",
  "inventory.update": "text-gold border-gold/40 bg-gold/[0.12]",
};

const NEUTRAL_STYLE =
  "text-ink-faint border-white/12 bg-white/[0.05] light:border-[rgba(26,13,18,0.12)]";

type Filter = "all" | "money" | "destructive";

const FILTERS: { key: Filter; label: string; actions?: string[] }[] = [
  { key: "all", label: "Everything" },
  {
    key: "money",
    label: "Money",
    actions: ["order.status_change", "return.status_change", "inventory.update"],
  },
  { key: "destructive", label: "Deletions", actions: ["category.delete"] },
];

export function ActivityView({ entries }: { entries: AdminAuditEntry[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [actor, setActor] = useState("");

  const actors = useMemo(
    () => Array.from(new Set(entries.map((e) => e.actorEmail))).sort(),
    [entries],
  );

  const shown = useMemo(() => {
    const allowed = FILTERS.find((f) => f.key === filter)?.actions;
    return entries.filter(
      (e) =>
        (!allowed || allowed.includes(e.action)) && (!actor || e.actorEmail === actor),
    );
  }, [entries, filter, actor]);

  return (
    <div className="flex flex-col gap-5">
      <div className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[26px] text-ink m-0">Activity</h2>
            <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5 max-w-[560px]">
              Every change made through this panel, newest first. Records are written
              alongside the change itself, so nothing done here is missing — but changes
              made directly in the database do not appear. Kept for 12 months.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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

        {actors.length > 1 && (
          <div className="mt-4">
            <label
              className="block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5"
              htmlFor="activity-actor"
            >
              Admin
            </label>
            <select
              id="activity-actor"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink outline-none focus:border-pink light:bg-white light:border-[rgba(26,13,18,0.12)]"
            >
              <option value="">Everyone</option>
              {actors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={cardClass}>
        {shown.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            {entries.length === 0
              ? "Nothing recorded yet. Changes made from here will appear as they happen."
              : "No activity matches that filter."}
          </p>
        ) : (
          <div className="flex flex-col">
            {shown.map((e, i) => (
              <div
                key={e.id}
                className={
                  "py-3.5 " +
                  (i > 0
                    ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]"
                    : "")
                }
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span
                    className={
                      "rounded-full border py-0.5 px-2.5 font-sans text-[11px] font-semibold " +
                      (ACTION_STYLE[e.action] ?? NEUTRAL_STYLE)
                    }
                  >
                    {ACTION_LABEL[e.action] ?? e.action}
                  </span>
                  <span className="font-sans text-[13px] text-ink">{e.summary}</span>
                </div>
                <p className="font-sans text-[12px] text-ink-faint m-0 mt-1.5">
                  {e.actorEmail} · {e.timeLabel}
                  {e.ip ? ` · ${e.ip}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
