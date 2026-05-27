"use client";

import { useState } from "react";

function HeartIcon({ filled = false }: { filled?: boolean }) {
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

export function WishlistButton({ productName }: { productName: string }) {
  const [active, setActive] = useState(false);
  return (
    <button
      type="button"
      aria-label={
        active
          ? `Remove ${productName} from wishlist`
          : `Add ${productName} to wishlist`
      }
      aria-pressed={active}
      onClick={() => setActive((a) => !a)}
      className={
        "absolute top-3 right-3 z-[2] w-[34px] h-[34px] rounded-full " +
        "bg-[rgba(13,13,13,0.55)] backdrop-blur-[10px] border border-white/[0.08] " +
        "inline-flex items-center justify-center cursor-pointer " +
        "transition-[color,background-color,transform] duration-200 " +
        "hover:bg-[rgba(13,13,13,0.75)] hover:scale-[1.08] hover:text-pink " +
        "[&_svg]:w-4 [&_svg]:h-4 " +
        (active
          ? "text-pink [&_svg]:fill-pink [&_svg]:stroke-pink"
          : "text-ink-dim")
      }
    >
      <HeartIcon filled={active} />
    </button>
  );
}
