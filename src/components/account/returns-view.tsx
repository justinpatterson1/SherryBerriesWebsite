"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AccountOrder, AccountReturn } from "@/lib/queries/account";
import { allowedReasonsFor, RETURN_WINDOW_DAYS } from "@/lib/account/returns";
import { cardClass } from "./shared";

// Return requests are now backed by the ReturnRequest model (open-issues #16).
// Before this they lived in sessionStorage, reached nobody, and vanished with
// the tab; between then and now the view could only point at /contact.
//
// The reason list is narrowed per item by allowedReasonsFor(): jewelry and
// aftercare are final sale, so "Changed Mind" is not offered on them. The API
// re-checks the same rule — the select is a convenience, not the gate.

const STATUS_STYLE: Record<AccountReturn["status"], string> = {
  REQUESTED: "text-gold border-gold/40 bg-gold/[0.12]",
  APPROVED: "text-blush border-pink/40 bg-pink/[0.12]",
  REJECTED: "text-[#ff8d8d] border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.12)]",
  REFUNDED: "text-[#7ee0a8] border-[rgba(126,224,168,0.3)] bg-[rgba(126,224,168,0.12)]",
};

const STATUS_LABEL: Record<AccountReturn["status"], string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REFUNDED: "Refunded",
};

const fieldClass =
  "w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-white/12 bg-white/[0.03] " +
  "font-sans text-[14px] text-ink outline-none transition-[border-color] duration-200 " +
  "focus:border-pink light:bg-white light:border-[rgba(26,13,18,0.12)]";
const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5";

type ItemOption = {
  orderItemId: string;
  label: string;
  categorySlug: string;
  finalSale: boolean;
};

export function ReturnsView({
  eligibleOrders,
  returns,
  onSubmitted,
}: {
  eligibleOrders: AccountOrder[];
  returns: AccountReturn[];
  onSubmitted: (created: AccountReturn) => void;
}) {
  const [orderItemId, setOrderItemId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Items already under an open request cannot be requested again, so they are
  // left out rather than offered and then refused by the API.
  const openItemLabels = useMemo(
    () =>
      new Set(
        returns
          .filter((r) => r.status === "REQUESTED" || r.status === "APPROVED")
          .map((r) => `${r.orderNumber}::${r.itemName}`),
      ),
    [returns],
  );

  const options = useMemo<ItemOption[]>(
    () =>
      eligibleOrders.flatMap((o) =>
        o.items
          .filter((it) => !openItemLabels.has(`${o.orderNumber}::${it.name}`))
          .map((it) => ({
            orderItemId: it.id,
            label: `${o.orderNumber} — ${it.name}${it.variant ? ` (${it.variant})` : ""}`,
            categorySlug: it.categorySlug,
            finalSale: it.finalSale,
          })),
      ),
    [eligibleOrders, openItemLabels],
  );

  const selected = options.find((o) => o.orderItemId === orderItemId) ?? null;
  const reasons = selected ? allowedReasonsFor(selected.categorySlug) : [];

  const submit = async () => {
    if (!orderItemId) return setError("Please choose the item you want to return.");
    if (!reason) return setError("Please choose a reason.");
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId, reason, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onSubmitted({
        id: json.request.id,
        reference: json.request.reference,
        orderNumber: selected?.label.split(" — ")[0] ?? "",
        itemName: selected?.label.split(" — ")[1] ?? "",
        variant: null,
        reason,
        notes: notes || null,
        status: "REQUESTED",
        resolution: null,
        dateLabel: "Just now",
      });
      setOrderItemId("");
      setReason("");
      setNotes("");
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't open the return.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className={cardClass}>
        <h3 className="font-display text-[22px] text-ink m-0 mb-3">Request a return</h3>
        <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mb-5 max-w-[560px]">
          Jewelry and aftercare are final sale, so those can only be returned if
          something arrived <span className="text-ink">damaged, defective, or wrong</span>.
          Merchandise and accessories can be returned unused within {RETURN_WINDOW_DAYS} days.{" "}
          <Link href="/help/returns" className="text-blush underline">
            Read the policy
          </Link>
          .
        </p>

        {options.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            Nothing to return right now — items become available once an order has been
            delivered, and each item can have one open request at a time.
          </p>
        ) : (
          <div className="flex flex-col gap-4 max-w-[560px]">
            {error && (
              <p className="rounded-xl border border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.1)] px-4 py-2.5 font-sans text-[12px] text-[#ff8d8d] m-0">
                {error}
              </p>
            )}

            <div>
              <label className={labelClass} htmlFor="ret-item">
                Which item?
              </label>
              <select
                id="ret-item"
                className={fieldClass}
                value={orderItemId}
                onChange={(e) => {
                  setOrderItemId(e.target.value);
                  setReason("");
                }}
              >
                <option value="">Choose an item…</option>
                {options.map((o) => (
                  <option key={o.orderItemId} value={o.orderItemId}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="ret-reason">
                Reason
              </label>
              <select
                id="ret-reason"
                className={fieldClass}
                value={reason}
                disabled={!selected}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">
                  {selected ? "Choose a reason…" : "Choose an item first"}
                </option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {selected?.finalSale && (
                <p className="mt-1.5 font-sans text-[11px] leading-[1.5] text-ink-faint">
                  This is a final sale item, so &ldquo;Changed Mind&rdquo; is not available.
                </p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="ret-notes">
                Anything else? (optional)
              </label>
              <textarea
                id="ret-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tell us what happened. If it arrived damaged, we'll ask for photographs."
                className={fieldClass + " resize-y"}
              />
            </div>

            <div>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center min-h-[44px] py-3 px-6 rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer border-0 transition-transform duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? "Sending…" : "Open return request"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h3 className="font-display text-[22px] text-ink m-0 mb-4">Your return requests</h3>
        {returns.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            None yet. Anything you open will show here with its reference and status.
          </p>
        ) : (
          <div className="flex flex-col">
            {returns.map((r, i) => (
              <div
                key={r.id}
                className={
                  "py-4 " +
                  (i > 0 ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]" : "")
                }
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
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
                <p className="font-sans text-[13px] text-ink-dim m-0 mt-1.5">
                  {r.itemName}
                  {r.variant ? ` (${r.variant})` : ""} · {r.orderNumber} · {r.reason}
                </p>
                {r.resolution && (
                  <p className="font-sans text-[12px] leading-[1.55] text-ink-faint m-0 mt-1.5">
                    {r.resolution}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
