"use client";

import { useState, type KeyboardEvent } from "react";
import type { PromoSuccess } from "@/app/api/promo/route";

export type AppliedPromo = {
  code: string;
  percentageOff: number | null;
  amountOff: number | null;
  label: string;
};

type Totals = {
  subtotal: number;
  discount: number;
  giftWrap: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  taxable: number;
};

export function OrderSummary({
  totals,
  promo,
  onApplyPromo,
  onRemovePromo,
  onCheckout,
  onError,
}: {
  totals: Totals;
  promo: AppliedPromo | null;
  onApplyPromo: (promo: AppliedPromo) => void;
  onRemovePromo: () => void;
  onCheckout: () => void;
  onError: (msg: string) => void;
}) {
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const tryApply = async () => {
    if (applying || !code.trim()) return;
    setApplying(true);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        onError(body.error || "Hmm, that code didn't work");
        return;
      }
      const p = body as PromoSuccess;
      onApplyPromo({
        code: p.code,
        percentageOff: p.percentageOff,
        amountOff: p.amountOff,
        label: p.label,
      });
      setCode("");
    } finally {
      setApplying(false);
    }
  };

  const onPromoKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryApply();
    }
  };

  const handleCheckout = () => {
    if (redirecting) return;
    setRedirecting(true);
    setTimeout(() => {
      onCheckout();
      setRedirecting(false);
    }, 1100);
  };

  return (
    <aside
      className={
        "sticky top-[100px] self-start flex flex-col gap-5 p-7 rounded-[22px] " +
        "bg-card border border-pink/[0.18] " +
        "shadow-[0_24px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,79,163,0.08)_inset,0_0_80px_rgba(255,79,163,0.1)_inset] " +
        "max-[980px]:static max-[980px]:top-auto max-[640px]:p-5"
      }
    >
      <h2 className="font-display text-[28px] leading-none text-ink m-0 pb-3 border-b border-white/[0.06] light:border-[rgba(26,13,18,0.08)]">
        Order summary
      </h2>

      {promo ? (
        <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl border border-dashed border-pink/50 bg-pink/[0.06]">
          <span className="font-sans text-[12px] tracking-[0.12em] uppercase text-ink">
            <strong className="text-pink font-bold">{promo.code}</strong>
            <span className="text-ink-faint mx-1.5">—</span>
            {promo.label}
          </span>
          <button
            type="button"
            onClick={onRemovePromo}
            aria-label="Remove promo code"
            className="text-ink-faint hover:text-pink transition-colors text-sm leading-none bg-transparent border-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            id="promoInput"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onPromoKeyDown}
            placeholder="Promo code"
            autoComplete="off"
            className={
              "h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] " +
              "font-sans text-[12px] tracking-[0.14em] uppercase text-ink placeholder:text-ink-faint " +
              "outline-none transition-[border-color,background-color] duration-200 " +
              "focus:border-pink focus:bg-pink/[0.04] " +
              "light:bg-white light:border-[rgba(26,13,18,0.12)]"
            }
          />
          <button
            type="button"
            onClick={tryApply}
            disabled={applying || !code.trim()}
            className={
              "h-11 px-4 rounded-xl border border-pink bg-transparent text-pink " +
              "font-sans text-[11px] font-semibold tracking-[0.16em] uppercase cursor-pointer " +
              "transition-[background-color,color,transform] duration-200 " +
              "hover:bg-pink hover:text-white " +
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-pink"
            }
          >
            {applying ? "…" : "Apply"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <SummaryRow
          label={`Subtotal · ${totals.itemCount} ${totals.itemCount === 1 ? "item" : "items"}`}
          value={`$${totals.subtotal.toFixed(2)}`}
        />
        {totals.discount > 0 && promo && (
          <SummaryRow
            label={`Promo discount${promo.percentageOff ? ` (${promo.percentageOff}%)` : ""}`}
            value={`−$${totals.discount.toFixed(2)}`}
            valueClass="text-blush"
          />
        )}
        {totals.giftWrap > 0 && (
          <SummaryRow
            label="Gift wrap"
            value={`$${totals.giftWrap.toFixed(2)}`}
          />
        )}
        <SummaryRow
          label="Shipping"
          value={
            totals.shipping === 0 ? (
              <span className="text-[#3aa86b] uppercase tracking-[0.12em] text-[12px] font-semibold">
                Free ✦
              </span>
            ) : (
              `$${totals.shipping.toFixed(2)}`
            )
          }
        />
        <SummaryRow
          label="Estimated tax"
          value={`$${totals.tax.toFixed(2)}`}
        />
      </div>

      <div className="h-px bg-white/[0.06] light:bg-[rgba(26,13,18,0.08)]" />

      <div className="flex items-baseline justify-between">
        <span className="font-display text-[22px] leading-none text-ink">
          Total
        </span>
        <span className="font-serif text-[32px] font-semibold text-ink leading-none">
          ${totals.total.toFixed(2)}
        </span>
      </div>
      <p className="font-sans text-[11px] text-ink-faint -mt-2.5">
        or 4 interest-free payments of ${(totals.total / 4).toFixed(2)} with
        Afterpay
      </p>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={redirecting || totals.itemCount === 0}
        className={
          "relative w-full h-14 rounded-full border-0 bg-gradient-to-br from-pink to-pink-deep " +
          "text-white font-sans text-sm font-bold tracking-[0.16em] uppercase cursor-pointer " +
          "shadow-[0_14px_36px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
          "transition-[transform,box-shadow,opacity] duration-200 " +
          "hover:-translate-y-px hover:shadow-[0_18px_44px_rgba(255,79,163,0.5),0_0_0_1px_rgba(255,255,255,0.16)_inset] " +
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 " +
          "inline-flex items-center justify-center gap-2"
        }
      >
        {redirecting ? "Redirecting…" : "Secure checkout →"}
      </button>

      <div
        aria-hidden="true"
        className="flex items-center gap-3 my-1 font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-ink-faint before:content-[''] before:flex-1 before:h-px before:bg-white/[0.08] after:content-[''] after:flex-1 after:h-px after:bg-white/[0.08]"
      >
        express checkout
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onError("Shop Pay is a visual stub for v1")}
          className="h-11 rounded-xl border-0 bg-[#5a31f4] text-white font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-transform duration-200 hover:-translate-y-px"
        >
          Shop Pay
        </button>
        <button
          type="button"
          onClick={() => onError("PayPal is a visual stub for v1")}
          className="h-11 rounded-xl border border-white/14 bg-white/[0.03] text-ink font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-[color,border-color,transform] duration-200 hover:border-blush hover:-translate-y-px light:bg-white light:text-[#00457c] light:border-[rgba(0,69,124,0.2)]"
        >
          PayPal
        </button>
      </div>

      <ul className="flex flex-col gap-2 mt-1">
        <Perk>256-bit SSL secure checkout</Perk>
        <Perk>Free aftercare guide with every order</Perk>
        <Perk>Tracked shipping across Trinidad & Tobago</Perk>
      </ul>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="font-sans text-[13px] text-ink-dim">{label}</span>
      <span
        className={
          "font-sans text-[14px] tabular-nums " +
          (valueClass ?? "text-ink font-semibold")
        }
      >
        {value}
      </span>
    </div>
  );
}

function Perk({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 font-sans text-[12px] text-ink-faint">
      <span className="inline-flex w-[18px] h-[18px] items-center justify-center rounded-full bg-pink/[0.12] text-pink text-[11px]">
        ✓
      </span>
      {children}
    </li>
  );
}
