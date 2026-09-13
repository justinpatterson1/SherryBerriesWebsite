"use client";

import { useMemo, useState } from "react";
import type { AdminPayment } from "@/lib/queries/admin";
import { REJECTION_REASONS, timeRemaining } from "@/lib/checkout/bank-transfer";
import { btnOutline, btnSolid, cardPadded, ICONS } from "@/components/admin/shared";

// The bank transfer review queue.
//
// The whole screen exists to make one thing hard to do carelessly: marking an
// order PAID. A receipt is a customer's claim, not a payment, so Confirm sits
// behind a dialog that states the amount and asks you to have checked the bank
// account — and the wording says so rather than implying the receipt is proof.

const PILL: Record<string, string> = {
  AWAITING_PAYMENT: "text-gold border-gold/40 bg-gold/[0.12]",
  PAYMENT_SUBMITTED: "text-blush border-pink/30 bg-pink/[0.12]",
  PAID: "text-[#7ee0a8] border-[rgba(126,224,168,0.3)] bg-[rgba(126,224,168,0.12)]",
  REJECTED: "text-[#ff8d8d] border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.12)]",
  EXPIRED: "text-ink-faint border-white/12 bg-white/[0.05]",
};

const FILTERS = [
  { key: "review", label: "Needs review" },
  { key: "PAYMENT_SUBMITTED", label: "Submitted" },
  { key: "AWAITING_PAYMENT", label: "Awaiting" },
  { key: "REJECTED", label: "Rejected" },
  { key: "EXPIRED", label: "Expired" },
  { key: "all", label: "All" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pretty = (status: string) =>
  status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");

export function PaymentsView({
  payments,
  onConfirm,
  onReject,
}: {
  payments: AdminPayment[];
  onConfirm: (orderId: string) => Promise<boolean>;
  onReject: (orderId: string, reason: string, notes: string) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState<FilterKey>("review");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<AdminPayment | null>(null);
  const [rejecting, setRejecting] = useState<AdminPayment | null>(null);
  const [reason, setReason] = useState<string>(REJECTION_REASONS[0]);
  const [notes, setNotes] = useState("");

  const needsReview = useMemo(
    () => payments.filter((p) => p.paymentStatus === "PAYMENT_SUBMITTED").length,
    [payments],
  );

  const shown = useMemo(() => {
    if (filter === "all") return payments;
    if (filter === "review") return payments.filter((p) => p.paymentStatus === "PAYMENT_SUBMITTED");
    return payments.filter((p) => p.paymentStatus === filter);
  }, [payments, filter]);

  const doConfirm = async () => {
    if (!confirming) return;
    setBusy(true);
    await onConfirm(confirming.orderId);
    setBusy(false);
    setConfirming(null);
  };

  const doReject = async () => {
    if (!rejecting) return;
    setBusy(true);
    await onReject(rejecting.orderId, reason, notes);
    setBusy(false);
    setRejecting(null);
    setNotes("");
    setReason(REJECTION_REASONS[0]);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className={cardPadded}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[26px] text-ink m-0">Bank transfers</h2>
            <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5 max-w-[620px]">
              {needsReview > 0 ? (
                <>
                  <strong className="text-ink">{needsReview}</strong> awaiting verification. A
                  receipt is what the customer says they sent — check it against the bank
                  account before confirming.
                </>
              ) : (
                "Nothing awaiting verification. A receipt is what the customer says they sent — always check the bank account before confirming."
              )}
            </p>
          </div>
        </div>
      </div>

      <div className={cardPadded}>
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
              {f.key === "review" && needsReview > 0 ? ` (${needsReview})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className={cardPadded}>
        {shown.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            {payments.length === 0
              ? "No bank transfer orders yet."
              : "Nothing matches that filter."}
          </p>
        ) : (
          <div className="flex flex-col">
            {shown.map((p, i) => {
              const latest = p.receipts[0];
              return (
                <div
                  key={p.orderId}
                  className={
                    "flex flex-wrap items-start gap-4 py-4 " +
                    (i > 0
                      ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]"
                      : "")
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <code className="font-mono text-[15px] font-semibold text-ink tracking-[0.04em]">
                        {p.orderNumber}
                      </code>
                      <span className="font-sans text-[14px] text-ink-dim">{p.customer}</span>
                      <span className="font-sans text-[14px] text-blush">{money(p.amount)}</span>
                      <span
                        className={
                          "py-0.5 px-2 rounded-full border font-sans text-[10px] font-bold " +
                          "tracking-[0.1em] uppercase " +
                          (PILL[p.paymentStatus] ?? PILL.EXPIRED)
                        }
                      >
                        {pretty(p.paymentStatus)}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-ink-faint m-0 mt-1">
                      Placed {p.placedLabel}
                      {p.paymentStatus === "AWAITING_PAYMENT" && p.expiresAt
                        ? ` · expires in ${timeRemaining(new Date(p.expiresAt))}`
                        : ""}
                      {latest ? ` · receipt ${latest.uploadedLabel}` : " · no receipt yet"}
                    </p>
                    {p.rejectionReason && (
                      <p className="font-sans text-[11px] text-[#ff8d8d] m-0 mt-1">
                        {p.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {latest && (
                      <a
                        href={`/api/orders/${encodeURIComponent(p.orderNumber)}/receipt/${latest.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className={btnOutline + " no-underline"}
                      >
                        View receipt
                      </a>
                    )}
                    {p.paymentStatus === "PAYMENT_SUBMITTED" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirming(p)}
                          disabled={busy}
                          className={btnSolid}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejecting(p)}
                          disabled={busy}
                          className={btnOutline}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm — deliberately a dialog. This is the step that says money arrived. */}
      {confirming && (
        <Dialog title="Confirm bank transfer" onClose={() => setConfirming(null)}>
          <p className="font-sans text-[14px] leading-[1.7] text-ink m-0">
            You are confirming that{" "}
            <strong className="text-blush">{money(confirming.amount)} TTD</strong> has been
            received in the SherryBerries bank account for{" "}
            <strong className="text-ink">{confirming.orderNumber}</strong>.
          </p>
          <p className="font-sans text-[12px] leading-[1.6] text-ink-faint m-0 mt-2.5">
            The receipt is the customer&apos;s claim, not proof of payment. Only confirm if you
            have seen the funds. This moves the order into processing and is recorded against
            your account.
          </p>
          <div className="flex flex-wrap justify-end gap-2.5 mt-6">
            <button type="button" onClick={() => setConfirming(null)} className={btnOutline}>
              Cancel
            </button>
            <button type="button" onClick={doConfirm} disabled={busy} className={btnSolid}>
              {busy ? "Confirming…" : "Confirm payment"}
            </button>
          </div>
        </Dialog>
      )}

      {rejecting && (
        <Dialog title="Reject payment" onClose={() => setRejecting(null)}>
          <p className="font-sans text-[13px] leading-[1.65] text-ink-dim m-0">
            {rejecting.orderNumber} — {money(rejecting.amount)} TTD. The customer will see the
            reason and can upload another receipt.
          </p>

          <label
            htmlFor="reject-reason"
            className="block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mt-5 mb-1.5"
          >
            Reason
          </label>
          <select
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink outline-none focus:border-pink light:bg-white light:border-[rgba(26,13,18,0.12)]"
          >
            {REJECTION_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <label
            htmlFor="reject-notes"
            className="block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mt-4 mb-1.5"
          >
            Notes (optional)
          </label>
          <textarea
            id="reject-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Shown to the customer alongside the reason"
            className="w-full px-3.5 py-3 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink placeholder:text-ink-faint outline-none focus:border-pink resize-y light:bg-white light:border-[rgba(26,13,18,0.12)]"
          />

          <div className="flex flex-wrap justify-end gap-2.5 mt-6">
            <button type="button" onClick={() => setRejecting(null)} className={btnOutline}>
              Cancel
            </button>
            <button type="button" onClick={doReject} disabled={busy} className={btnSolid}>
              {busy ? "Rejecting…" : "Reject payment"}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] grid place-items-center p-4 bg-black/60 backdrop-blur-[6px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[520px] rounded-[22px] border border-line-pink bg-canvas-elev shadow-[0_30px_80px_rgba(0,0,0,0.6)] light:bg-card"
      >
        <div className="flex items-center justify-between gap-3 px-7 py-5 border-b border-white/[0.06] light:border-[rgba(26,13,18,0.06)]">
          <h3 className="font-display text-[22px] text-ink m-0">{title}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-full border border-white/12 text-ink-dim cursor-pointer transition-colors hover:text-ink hover:border-blush [&_svg]:w-4 [&_svg]:h-4 light:border-[rgba(26,13,18,0.12)]"
          >
            {ICONS.close}
          </button>
        </div>
        <div className="p-7">{children}</div>
      </div>
    </div>
  );
}
