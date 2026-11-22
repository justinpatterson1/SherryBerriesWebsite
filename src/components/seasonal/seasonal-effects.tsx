"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { previewSeason, seasonAt, type Season } from "@/lib/seasonal/season";
import { Snowfall } from "./snowfall";

// The visitor's own "snow off" choice, kept on their device only.
const OFF_KEY = "sb-seasonal-off";

// Nothing should move behind the payment form, and admin is not the shop.
function isExcluded(pathname: string | null): boolean {
  return !pathname || pathname.startsWith("/admin") || pathname.startsWith("/checkout");
}

function readOff(): boolean {
  try {
    return localStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
}

function writeOff(off: boolean): void {
  try {
    if (off) localStorage.setItem(OFF_KEY, "1");
    else localStorage.removeItem(OFF_KEY);
  } catch {
    // Storage blocked: the choice lasts until the page is reloaded.
  }
}

/** Seasonal decorations (snow at Christmas), with a visitor on/off button. Mounted in the root layout. */
export function SeasonalEffects() {
  const pathname = usePathname();
  const excluded = isExcluded(pathname);
  const [season, setSeason] = useState<Season | null>(null);
  const [off, setOff] = useState(false);

  // Decided after mount, never during render: the date, the visitor's saved
  // choice and their motion setting only exist in the browser, and reading
  // them on the server would mismatch on hydration.
  useEffect(() => {
    if (excluded) return;
    const active =
      previewSeason(new URLSearchParams(window.location.search).get("season")) ??
      seasonAt(new Date());
    if (!active) return;
    // People who ask their device for less motion get no animation at all.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    fetch("/api/seasonal")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { enabled?: boolean } | null) => {
        if (cancelled || !json?.enabled) return;
        setOff(readOff());
        setSeason(active);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [excluded]);

  if (excluded || !season) return null;

  const toggle = () => {
    writeOff(!off);
    setOff(!off);
  };

  return (
    <>
      {!off && season === "christmas" && <Snowfall />}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={!off}
        className="fixed bottom-5 left-5 z-[60] inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-line-pink bg-canvas-elev/85 backdrop-blur-md font-sans text-[12px] font-semibold text-ink-dim cursor-pointer transition-colors duration-200 hover:text-blush hover:border-pink"
      >
        <span aria-hidden="true">❄</span>
        {off ? "Snow on" : "Snow off"}
      </button>
    </>
  );
}
