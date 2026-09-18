"use client";

import { useEffect, useState } from "react";

// Appears once the listing has scrolled far enough that the category chips and
// the navbar are out of reach. Bottom-right: the toasts across the site all sit
// bottom-centre (z-200), so this stays clear of them.
const SHOW_AFTER_PX = 600;

export function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      // Hidden from the tab order while invisible, so a keyboard user never
      // lands on a button they cannot see.
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={
        "fixed bottom-8 right-8 z-[100] grid place-items-center w-12 h-12 rounded-full " +
        "border border-white/12 bg-card text-ink shadow-[0_10px_30px_rgba(0,0,0,0.45)] " +
        "transition-[opacity,transform,border-color,color] duration-300 " +
        "hover:border-pink hover:text-pink hover:-translate-y-0.5 " +
        "max-[900px]:bottom-6 max-[900px]:right-6 " +
        (shown
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none")
      }
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-[18px] h-[18px]"
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}
