"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import type { CartSnapshotLine } from "@/app/api/cart/snapshot/route";
import { CheckmarkSpinner, money } from "./shared";

export type AppliedPromo = {
  code: string;
  percentageOff: number | null;
  amountOff: number | null;
  label: string;
};

export function CheckoutSummary({
  items,
  totals,
  shippingLabel,
  promo,
  placing,
  onApplyPromo,
  onRemovePromo,
  onError,
  onPlaceOrder,
}: {
  items: CartSnapshotLine[];
  totals: { subtotal: number; discount: number; shipFee: number; total: number };
  shippingLabel: string;
  promo: AppliedPromo | null;
  placing: boolean;
  onApplyPromo: (p: AppliedPromo) => void;
  onRemovePromo: () => void;
  onError: (msg: string) => void;
  onPlaceOrder: () => void;
}) {
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);

  const apply = async () => {
    const trimmed = code.trim();
    if (!trimmed || applying) return;
    setApplying(true);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as AppliedPromo & { error?: string };
      if (!res.ok || !data.code) {
        onError(data.error ?? "Hmm, that code didn't work.");
        return;
      }
      onApplyPromo({
        code: data.code,
        percentageOff: data.percentageOff,
        amountOff: data.amountOff,
        label: data.label,
      });
      setCode("");
    } finally {
      setApplying(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      apply();
    }
  };

  return (
    <aside className="sticky top-[100px] max-[940px]:static rounded-[18px] border border-line-pink bg-card p-6 light:border-[rgba(26,13,18,0.1)] light:bg-card">
      <h2 className="font-display text-[24px] text-ink m-0 mb-4">Order summary</h2>

      {/* Line items */}
      <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1 -mr-1">
        {items.map((it) => (
          <div
            key={`${it.productId}::${it.variantId ?? ""}`}
            className="flex items-center gap-3"
          >
            <span className="relative flex-none w-14 h-14 rounded-[10px] overflow-hidden border border-white/[0.06] bg-canvas-2 light:border-[rgba(26,13,18,0.08)]">
              {it.imageUrl ? (
                <Image src={it.imageUrl} alt={it.productName} fill sizes="56px" className="object-cover" />
              ) : (
                <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,79,163,0.25),rgba(212,175,55,0.18))]" />
              )}
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-pink text-white font-sans text-[10px] font-bold">
                {it.quantity}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[13px] font-semibold text-ink m-0 truncate">
                {it.productName}
              </p>
              {(it.variantValue || it.categoryName) && (
                <p className="font-sans text-[11px] text-ink-faint m-0 mt-0.5 truncate">
                  {it.variantValue ?? it.categoryName}
                </p>
              )}
            </div>
            <span className="font-serif text-[14px] font-semibold text-ink whitespace-nowrap">
              {money(it.unitPrice * it.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Promo */}
      <div className="mt-5 pt-5 border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]">
        {promo ? (
          <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl border border-pink/30 bg-pink/[0.08]">
            <span className="font-sans text-[12px] font-bold tracking-[0.08em] text-blush">
              ✦ {promo.code} applied
            </span>
            <button
              type="button"
              onClick={onRemovePromo}
              aria-label="Remove promo code"
              className="flex-none w-6 h-6 grid place-items-center rounded-full text-ink-faint hover:text-[#ff8d8d] hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={onKey}
              placeholder="Promo code"
              aria-label="Promo code"
              className="flex-1 h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[13px] text-ink placeholder:text-ink-faint outline-none focus:border-pink focus:bg-pink/[0.04] uppercase tracking-[0.06em] light:bg-white light:border-[rgba(26,13,18,0.12)]"
            />
            <button
              type="button"
              onClick={apply}
              disabled={applying || !code.trim()}
              className="flex-none py-2.5 px-4 rounded-xl border border-white/14 bg-transparent text-ink-dim font-sans text-[11px] font-bold tracking-[0.12em] uppercase cursor-pointer hover:text-ink hover:border-blush transition-colors disabled:opacity-50 disabled:cursor-not-allowed light:border-[rgba(26,13,18,0.14)]"
            >
              {applying ? "…" : "Apply"}
            </button>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="mt-5 flex flex-col gap-2">
        <Row label="Subtotal" value={money(totals.subtotal)} />
        {totals.discount > 0 && (
          <Row label="Discount" value={`−${money(totals.discount)}`} blush />
        )}
        <Row
          label={`Shipping · ${shippingLabel}`}
          value={
            totals.shipFee === 0 ? (
              <span className="text-[#5fd29a] font-semibold">Free</span>
            ) : (
              money(totals.shipFee)
            )
          }
        />
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]">
          <span className="font-sans text-[13px] font-semibold tracking-[0.04em] uppercase text-ink-dim">
            Total
          </span>
          <span className="font-serif text-[28px] font-semibold text-ink">
            {money(totals.total)}
          </span>
        </div>
      </div>

      {/* Place order */}
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={placing}
        className={
          "relative overflow-hidden w-full mt-5 py-4 rounded-full border-0 cursor-pointer " +
          "bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[13px] font-bold tracking-[0.14em] uppercase " +
          "shadow-[0_12px_30px_rgba(255,79,163,0.36)] transition-transform duration-200 " +
          "hover:-translate-y-px disabled:opacity-80 disabled:cursor-wait disabled:hover:translate-y-0 " +
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-gold before:to-pink before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
        }
      >
        <span className="relative z-[1] inline-flex items-center gap-2">
          {placing && <CheckmarkSpinner />}
          {placing ? "Placing your order…" : "Place order"}
        </span>
      </button>

      <p className="flex items-center justify-center gap-1.5 mt-3 font-sans text-[11px] text-[#5fd29a] m-0">
        <LockIcon /> Secure checkout · your details are protected
      </p>
    </aside>
  );
}

function Row({
  label,
  value,
  blush,
}: {
  label: string;
  value: React.ReactNode;
  blush?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-[13px] text-ink-dim">{label}</span>
      <span className={"font-sans text-[13px] " + (blush ? "text-blush font-semibold" : "text-ink")}>
        {value}
      </span>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
