"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { BankDetails, BankPaymentStatus } from "@/lib/checkout/bank-transfer";
import { RECEIPT_MAX_BYTES, RECEIPT_MIME_TYPES } from "@/lib/checkout/bank-transfer";

// The customer's side of a bank transfer: what to pay, where to pay it, and
// somewhere to upload the proof.
//
// The page deliberately never claims the order is paid. Uploading a receipt
// moves it to "Payment submitted" and nothing more — only an admin who checked
// the bank account can confirm it.

type Receipt = {
  id: string;
  status: string;
  fileType: string;
  uploadedLabel: string;
};

const cardClass =
  "rounded-[18px] border border-line bg-card p-6 max-[600px]:p-5";
const rowLabel =
  "font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint";

const PILL: Record<BankPaymentStatus, string> = {
  AWAITING_PAYMENT: "text-gold border-gold/40 bg-gold/[0.12]",
  PAYMENT_SUBMITTED: "text-blush border-pink/30 bg-pink/[0.1]",
  PAID: "text-[#7ee0a8] border-[rgba(126,224,168,0.3)] bg-[rgba(126,224,168,0.12)]",
  REJECTED: "text-[#ff8d8d] border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.12)]",
  EXPIRED: "text-ink-faint border-white/12 bg-white/[0.05]",
};

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TTD`;

export function BankTransferPanel({
  orderNumber,
  amount,
  status,
  statusLabel,
  remaining,
  windowHours,
  canSubmit,
  rejectionReason,
  details,
  receipts,
}: {
  orderNumber: string;
  amount: number;
  status: BankPaymentStatus;
  statusLabel: string;
  remaining: string;
  windowHours: number;
  canSubmit: boolean;
  rejectionReason: string | null;
  details: BankDetails | null;
  receipts: Receipt[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Only for the local preview — the server re-derives the type from the upload
  // itself, so nothing here is trusted for validation.
  const previewUrl = file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

  const submit = async () => {
    if (!file || busy) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/receipt`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      setDone(true);
      // Re-read from the server rather than patching state: the payment status
      // has changed and the page's own copy is now stale.
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submitted = status === "PAYMENT_SUBMITTED";
  const paid = status === "PAID";

  return (
    <main className="pt-[120px] pb-24 px-[8%] max-[600px]:pt-[92px] max-[600px]:px-[6%]">
      <div className="max-w-[720px] mx-auto flex flex-col gap-5">
        <div className="flex flex-col gap-3.5">
          <span className="font-sans text-[13px] font-medium tracking-[0.22em] uppercase text-pink">
            Order {orderNumber}
          </span>
          <h1 className="font-display text-[clamp(34px,4.4vw,52px)] leading-[1.05] tracking-[-0.01em] text-ink m-0">
            {paid ? (
              <>
                Payment <span className="font-serif italic">confirmed</span>.
              </>
            ) : submitted ? (
              <>
                Payment <span className="font-serif italic">submitted</span>.
              </>
            ) : (
              <>
                Complete your <span className="font-serif italic">bank transfer</span>.
              </>
            )}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={
                "py-1 px-3 rounded-full border font-sans text-[11px] font-bold tracking-[0.1em] uppercase " +
                (PILL[status] ?? PILL.EXPIRED)
              }
            >
              {statusLabel}
            </span>
            {status === "AWAITING_PAYMENT" && (
              <span className="font-sans text-[13px] text-ink-dim">
                Payment expires in <strong className="text-ink">{remaining}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className={cardClass}>
          <span className={rowLabel}>Amount due</span>
          <p className="font-display text-[32px] text-ink m-0 mt-1.5">{money(amount)}</p>
          {!paid && !submitted && (
            <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-3">
              Your order has been received but is <strong className="text-ink">not yet
              confirmed</strong>. Your items are temporarily reserved — please complete your
              transfer and upload your receipt within {windowHours} hours. Unpaid orders may
              be cancelled and the items returned to stock.
            </p>
          )}
        </div>

        {status === "REJECTED" && (
          <div className="rounded-[18px] border border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.08)] p-6">
            <span className={rowLabel}>We couldn&apos;t verify that payment</span>
            <p className="font-sans text-[14px] leading-[1.65] text-ink m-0 mt-2">
              {rejectionReason || "Please check the details and upload a new receipt."}
            </p>
          </div>
        )}

        {submitted && (
          <div className={cardClass}>
            <p className="font-sans text-[15px] leading-[1.7] text-ink m-0">
              Thank you, Sweet Berry! We&apos;ve received your payment receipt for{" "}
              {orderNumber}. We&apos;ll verify the transfer and confirm your order once the
              payment has arrived — no further action is needed right now.
            </p>
          </div>
        )}

        {/* Bank details */}
        {!paid && (
          <div className={cardClass}>
            <span className={rowLabel}>Bank details</span>
            {details ? (
              <>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 m-0 mt-3">
                  <dt className="font-sans text-[13px] text-ink-faint">Bank</dt>
                  <dd className="font-sans text-[14px] text-ink m-0">{details.bankName}</dd>
                  <dt className="font-sans text-[13px] text-ink-faint">Account name</dt>
                  <dd className="font-sans text-[14px] text-ink m-0">{details.accountName}</dd>
                  <dt className="font-sans text-[13px] text-ink-faint">Account type</dt>
                  <dd className="font-sans text-[14px] text-ink m-0">{details.accountType}</dd>
                  <dt className="font-sans text-[13px] text-ink-faint">Account number</dt>
                  <dd className="font-mono text-[14px] text-ink m-0">{details.accountNumber}</dd>
                  <dt className="font-sans text-[13px] text-ink-faint">Reference</dt>
                  <dd className="font-mono text-[14px] text-blush m-0">{orderNumber}</dd>
                </dl>
                <p className="font-sans text-[12px] leading-[1.6] text-ink-faint m-0 mt-4">
                  Please put <strong className="text-ink-dim">{orderNumber}</strong> in the
                  transfer description so we can match your payment to this order.
                </p>
              </>
            ) : (
              <p className="font-sans text-[14px] leading-[1.65] text-ink-dim m-0 mt-2">
                Our bank details aren&apos;t available right now. Please{" "}
                <Link href="/contact" className="text-blush">
                  contact us
                </Link>{" "}
                and we&apos;ll send them to you directly.
              </p>
            )}
          </div>
        )}

        {/* Upload */}
        {canSubmit && (
          <div className={cardClass}>
            <span className={rowLabel}>Upload proof of payment</span>
            <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5 mb-4">
              A screenshot or PDF of your transfer confirmation. JPG, PNG, WEBP or PDF, up to{" "}
              {Math.round(RECEIPT_MAX_BYTES / (1024 * 1024))} MB.
            </p>

            {error && (
              <p className="rounded-xl border border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.1)] px-4 py-2.5 font-sans text-[12px] text-[#ff8d8d] mb-3">
                {error}
              </p>
            )}

            {previewUrl && (
              /* A blob: preview of the customer's own file, shown before it
                 is uploaded. next/image cannot optimise a local blob and
                 there is no remote URL to give it. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Your receipt, before uploading"
                className="max-h-[260px] w-auto rounded-xl border border-line mb-3.5"
              />
            )}

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept={RECEIPT_MIME_TYPES.join(",")}
                onChange={(e) => {
                  setError(null);
                  setFile(e.target.files?.[0] ?? null);
                }}
                className="font-sans text-[13px] text-ink-dim file:mr-3 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:cursor-pointer file:bg-white/[0.06] file:text-ink file:font-sans file:text-[11px] file:font-bold file:tracking-[0.12em] file:uppercase"
              />
              <button
                type="button"
                onClick={submit}
                disabled={!file || busy || done}
                className={
                  "inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full border-0 cursor-pointer " +
                  "bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[11px] font-bold tracking-[0.12em] uppercase " +
                  "shadow-[0_8px_20px_rgba(255,79,163,0.34)] transition-transform duration-200 hover:-translate-y-px " +
                  "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                }
              >
                {busy ? "Uploading…" : done ? "✓ Submitted" : "Submit payment receipt"}
              </button>
            </div>
          </div>
        )}

        {/* History — kept across resubmissions so a rejection and its fix are both visible. */}
        {receipts.length > 0 && (
          <div className={cardClass}>
            <span className={rowLabel}>Receipts you&apos;ve sent</span>
            <ul className="flex flex-col gap-2.5 m-0 mt-3 p-0 list-none">
              {receipts.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 font-sans text-[13px]"
                >
                  <span className="text-ink-dim">{r.uploadedLabel}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-ink-faint text-[11px] uppercase tracking-[0.1em]">
                      {r.status.toLowerCase()}
                    </span>
                    <a
                      href={`/api/orders/${encodeURIComponent(orderNumber)}/receipt/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blush no-underline hover:text-pink"
                    >
                      View
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-3.5 mt-2">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 py-3.5 px-6 rounded-full no-underline bg-white/[0.04] border border-white/[0.14] text-ink font-sans text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-pink light:bg-[rgba(26,13,18,0.04)] light:border-[rgba(26,13,18,0.14)]"
          >
            My orders
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 py-3.5 px-6 rounded-full no-underline bg-white/[0.04] border border-white/[0.14] text-ink font-sans text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-pink light:bg-[rgba(26,13,18,0.04)] light:border-[rgba(26,13,18,0.14)]"
          >
            Keep shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
