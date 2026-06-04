"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AccountOrder } from "@/lib/queries/account";
import { StatusBadge, btnSolid, cardClass, type ReturnRequest } from "./shared";

const fieldClass =
  "w-full h-12 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] " +
  "font-sans text-[14px] text-ink outline-none transition-[border-color,background-color] duration-200 " +
  "focus:border-pink focus:bg-pink/[0.04] disabled:opacity-50 disabled:cursor-not-allowed " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";

const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-ink-faint mb-1.5";

export function ReturnsView({
  eligibleOrders,
  reasons,
  returns,
  prefillOrderId,
  onSubmit,
}: {
  eligibleOrders: AccountOrder[];
  reasons: string[];
  returns: ReturnRequest[];
  prefillOrderId: string | null;
  onSubmit: (data: { orderId: string; product: string; reason: string; notes: string }) => void;
}) {
  const [orderId, setOrderId] = useState("");
  const [product, setProduct] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  // Honor a pre-selected order when arriving from an order's "Request a return".
  useEffect(() => {
    if (prefillOrderId && eligibleOrders.some((o) => o.id === prefillOrderId)) {
      // Deferred to satisfy React 19's no-sync-setState-in-effect rule.
      queueMicrotask(() => {
        setOrderId(prefillOrderId);
        setProduct("");
      });
    }
  }, [prefillOrderId, eligibleOrders]);

  const productOptions = useMemo(() => {
    const order = eligibleOrders.find((o) => o.id === orderId);
    // De-dup item names within the order.
    return Array.from(new Set((order?.items ?? []).map((it) => it.name)));
  }, [eligibleOrders, orderId]);

  const valid = Boolean(orderId && product && reason);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onSubmit({ orderId, product, reason, notes: notes.trim() });
    setOrderId("");
    setProduct("");
    setReason("");
    setNotes("");
    setTouched(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[30px] leading-tight text-ink m-0">Returns</h2>
        <p className="font-sans text-[13px] text-ink-dim m-0 mt-1.5">
          Start a return on a delivered order, or check the status of an existing request.
        </p>
      </div>

      {/* Create return */}
      <div className={cardClass + " mb-6"}>
        <h3 className="font-display text-[22px] text-ink m-0 mb-5">Start a return</h3>

        {eligibleOrders.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            You don&apos;t have any delivered orders eligible for return right now.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
              <div>
                <label className={labelClass} htmlFor="ret-order">Order</label>
                <select
                  id="ret-order"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setProduct("");
                  }}
                  className={fieldClass}
                >
                  <option value="">Select an order…</option>
                  {eligibleOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.dateLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="ret-product">Product</label>
                <select
                  id="ret-product"
                  value={product}
                  disabled={!orderId}
                  onChange={(e) => setProduct(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">{orderId ? "Select a product…" : "Choose an order first"}</option>
                  {productOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="ret-reason">Reason</label>
              <select
                id="ret-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={fieldClass}
              >
                <option value="">Select a reason…</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="ret-notes">Notes (optional)</label>
              <textarea
                id="ret-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything we should know?"
                className={
                  "w-full px-3.5 py-3 rounded-xl border border-white/12 bg-white/[0.03] resize-y " +
                  "font-sans text-[14px] text-ink placeholder:text-ink-faint outline-none " +
                  "transition-[border-color,background-color] duration-200 focus:border-pink focus:bg-pink/[0.04] " +
                  "light:bg-white light:border-[rgba(26,13,18,0.12)]"
                }
              />
            </div>

            {touched && !valid && (
              <p className="font-sans text-[13px] text-[#ff8d8d] m-0">
                Please choose an order, product, and reason.
              </p>
            )}

            <button type="submit" className={btnSolid + " self-start"}>
              Submit return request
            </button>
          </form>
        )}
      </div>

      {/* Existing requests */}
      <div className={cardClass}>
        <h3 className="font-display text-[22px] text-ink m-0 mb-4">Your return requests</h3>
        {returns.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            No return requests yet.
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-sans text-[14px] font-semibold text-ink">{r.id}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="font-sans text-[12px] text-ink-faint m-0 mt-1">
                  {r.product} · {r.orderNumber} · {r.date}
                </p>
                <p className="font-sans text-[13px] text-blush m-0 mt-1.5">{r.reason}</p>
                {r.notes && (
                  <p className="font-sans text-[13px] text-ink-dim m-0 mt-1">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
