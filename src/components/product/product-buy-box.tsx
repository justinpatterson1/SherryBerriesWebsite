"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";

type Variant = {
  id: string;
  name: string;
  value: string;
  inventory: number;
  additionalPrice: number;
};

export function ProductBuyBox({
  productId,
  productName,
  basePrice,
  compareAtPrice,
  variants,
  inventory,
  lowStockThreshold,
}: {
  productId: string;
  productName: string;
  basePrice: number;
  compareAtPrice: number | null;
  variants: Variant[];
  inventory: number;
  lowStockThreshold: number;
}) {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id ?? null,
  );
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; id: number; tone: "ok" | "err" } | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const variantGroup = variants[0]?.name ?? null;
  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );

  const finalUnit = basePrice + (selectedVariant?.additionalPrice ?? 0);
  const effectiveInventory = selectedVariant ? selectedVariant.inventory : inventory;
  const outOfStock = effectiveInventory <= 0;
  const lowStock = !outOfStock && effectiveInventory <= lowStockThreshold;

  useEffect(() => {
    if (!ctaRef.current) return;
    const el = ctaRef.current;
    const obs = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const incQty = () => setQty((q) => Math.min(10, q + 1));
  const decQty = () => setQty((q) => Math.max(1, q - 1));

  const handleAdd = async () => {
    if (outOfStock || busy) return;
    setBusy(true);
    const result = await addItem({
      productId,
      variantId: selectedVariant?.id ?? null,
      quantity: qty,
    });
    setBusy(false);
    if (result.ok) {
      setToast({
        msg: `${productName} added to bag ✦`,
        id: Date.now(),
        tone: "ok",
      });
    } else {
      setToast({
        msg: result.error || "Couldn't add to bag ♡",
        id: Date.now(),
        tone: "err",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-serif text-[34px] font-semibold text-ink leading-none">
          ${finalUnit.toFixed(2)}
        </span>
        {compareAtPrice && compareAtPrice > basePrice && (
          <span className="font-sans text-[15px] text-ink-faint line-through">
            ${compareAtPrice.toFixed(2)}
          </span>
        )}
        <span className="font-sans text-[11px] tracking-[0.16em] uppercase text-ink-faint">
          TTD
        </span>
      </div>

      <div className="flex items-center gap-2 font-sans text-xs tracking-[0.14em] uppercase">
        <span
          className={
            "inline-flex h-[7px] w-[7px] rounded-full " +
            (outOfStock
              ? "bg-[#d63a3a]"
              : lowStock
              ? "bg-gold"
              : "bg-[#3aa86b]")
          }
        />
        <span
          className={
            outOfStock
              ? "text-[#d63a3a]"
              : lowStock
              ? "text-gold"
              : "text-ink-dim"
          }
        >
          {outOfStock
            ? "Out of stock"
            : lowStock
            ? `Low stock — only ${effectiveInventory} left`
            : "In stock"}
        </span>
      </div>

      {variants.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-ink-faint">
            {variantGroup ?? "Variant"}
          </span>
          <div role="radiogroup" aria-label={variantGroup ?? "Variant"} className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const disabled = v.inventory <= 0;
              const active = v.id === selectedVariantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={
                    "py-2.5 px-4 rounded-full border font-sans text-xs font-semibold tracking-[0.12em] uppercase " +
                    "transition-[background-color,color,border-color,transform,box-shadow] duration-200 cursor-pointer " +
                    (disabled
                      ? "opacity-40 line-through cursor-not-allowed border-white/10 text-ink-faint"
                      : active
                      ? "bg-ink text-canvas border-ink shadow-[0_6px_16px_rgba(255,79,163,0.18)] -translate-y-px"
                      : "border-white/12 text-ink-dim hover:border-blush hover:text-ink")
                  }
                >
                  {v.value}
                  {v.additionalPrice > 0 && (
                    <span className="ml-1.5 opacity-70 font-normal normal-case tracking-normal">
                      +${v.additionalPrice.toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-ink-faint">
          Quantity
        </span>
        <div className="inline-flex items-center self-start rounded-full border border-white/12 bg-white/[0.03] overflow-hidden">
          <QtyButton label="Decrease quantity" onClick={decQty} disabled={qty <= 1}>−</QtyButton>
          <span aria-live="polite" className="px-5 py-2.5 font-sans text-sm font-semibold text-ink min-w-[44px] text-center">
            {qty}
          </span>
          <QtyButton label="Increase quantity" onClick={incQty} disabled={qty >= 10 || outOfStock}>+</QtyButton>
        </div>
      </div>

      <button
        ref={ctaRef}
        type="button"
        onClick={handleAdd}
        disabled={outOfStock || busy}
        className={
          "mt-2 py-[18px] px-7 rounded-full border-0 bg-gradient-to-br from-pink to-pink-deep " +
          "text-white font-sans text-sm font-bold tracking-[0.16em] uppercase cursor-pointer " +
          "shadow-[0_14px_36px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
          "transition-[transform,box-shadow,opacity] duration-200 " +
          "hover:-translate-y-px hover:shadow-[0_18px_44px_rgba(255,79,163,0.5),0_0_0_1px_rgba(255,255,255,0.16)_inset] " +
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        }
      >
        {outOfStock
          ? "Sold out"
          : busy
          ? "Adding…"
          : `Add to bag · $${(finalUnit * qty).toFixed(2)}`}
      </button>

      {/* Mobile sticky add bar */}
      <div
        aria-hidden={!showSticky}
        className={
          "fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-3 " +
          "bg-[rgba(11,9,10,0.92)] backdrop-blur-[18px] border-t border-white/[0.08] " +
          "light:bg-[rgba(253,247,244,0.94)] light:border-[rgba(26,13,18,0.08)] " +
          "transition-[transform,opacity] duration-[260ms] " +
          "hidden max-[880px]:block " +
          (showSticky
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none")
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-ink-faint">
              {qty} × {selectedVariant?.value ?? "Item"}
            </span>
            <span className="font-serif text-[18px] font-semibold text-ink leading-none">
              ${(finalUnit * qty).toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock || busy}
            className={
              "ml-auto py-3 px-5 rounded-full border-0 bg-gradient-to-br from-pink to-pink-deep " +
              "text-white font-sans text-xs font-bold tracking-[0.14em] uppercase cursor-pointer " +
              "shadow-[0_10px_24px_rgba(255,79,163,0.4)] " +
              "disabled:opacity-50 disabled:cursor-not-allowed"
            }
          >
            {outOfStock ? "Sold out" : busy ? "Adding…" : "Add to bag"}
          </button>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] py-3.5 px-[22px] rounded-full " +
          "bg-[rgba(15,12,13,0.92)] border text-white font-sans text-[13px] font-medium tracking-[0.04em] " +
          "backdrop-blur-[20px] shadow-[0_18px_40px_rgba(0,0,0,0.5)] " +
          "transition-[opacity,transform] duration-[240ms] pointer-events-none " +
          (toast?.tone === "err" ? "border-[#d63a3a]/40" : "border-pink/[0.28]") +
          " " +
          (toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5")
        }
      >
        {toast?.msg}
      </div>
    </div>
  );
}

function QtyButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={
        "w-10 h-10 inline-flex items-center justify-center text-ink font-sans text-lg " +
        "bg-transparent border-0 cursor-pointer transition-[color,background-color] duration-200 " +
        "hover:text-pink hover:bg-pink/[0.08] " +
        "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      }
    >
      {children}
    </button>
  );
}
