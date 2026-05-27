"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/components/providers/wishlist-provider";

export function ProductWishlistButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { isWishlisted, toggle } = useWishlist();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const active = isWishlisted(productId);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    const result = await toggle(productId);
    setBusy(false);
    if (!result.ok) {
      setToast(result.error || "Couldn't update wishlist ♡");
      return;
    }
    setToast(
      result.inWishlist
        ? `${productName} saved to wishlist ♡`
        : `${productName} removed from wishlist`,
    );
  };

  return (
    <>
      <button
        type="button"
        aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={active}
        onClick={handleClick}
        disabled={busy}
        className={
          "inline-flex items-center gap-2 py-3 px-5 rounded-full border " +
          "font-sans text-xs font-semibold tracking-[0.14em] uppercase cursor-pointer " +
          "transition-[color,border-color,background-color,transform] duration-200 " +
          "[&_svg]:w-[18px] [&_svg]:h-[18px] " +
          (active
            ? "border-pink bg-pink/[0.12] text-pink"
            : "border-white/12 bg-white/[0.03] text-ink-dim hover:border-blush hover:text-ink") +
          " disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        <HeartIcon filled={active} />
        {active ? "Saved" : "Save"}
      </button>
      <div
        role="status"
        aria-live="polite"
        className={
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] py-3 px-5 rounded-full " +
          "bg-[rgba(15,12,13,0.92)] border border-pink/[0.28] text-white font-sans text-[13px] font-medium tracking-[0.04em] " +
          "backdrop-blur-[20px] shadow-[0_18px_40px_rgba(0,0,0,0.5)] " +
          "transition-[opacity,transform] duration-[240ms] pointer-events-none " +
          (toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5")
        }
      >
        {toast}
      </div>
    </>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
