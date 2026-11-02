"use client";

import { useEffect, useRef, useState } from "react";
import { countdownParts } from "@/lib/popups/schedule";

const UNITS = [
  ["days", "Days"],
  ["hours", "Hrs"],
  ["minutes", "Min"],
  ["seconds", "Sec"],
] as const;

/**
 * Ticking days/hours/minutes/seconds tiles. Calls `onEnd` once when the time
 * runs out, which is how a popup closes itself the moment its offer ends.
 */
export function PopupCountdown({
  endsAt,
  onEnd,
  overImage = false,
}: {
  endsAt: string;
  onEnd?: () => void;
  /** Sitting on a full graphic: darker glass tiles so the digits stay legible. */
  overImage?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  const parts = countdownParts(endsAt, now);
  const ended = parts === null;

  useEffect(() => {
    if (ended) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ended]);

  // Held in a ref so a parent re-rendering with a new function does not count
  // as the countdown ending again.
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);
  useEffect(() => {
    if (ended) onEndRef.current?.();
  }, [ended]);

  if (!parts) {
    return (
      <p className="font-sans text-[12px] font-bold tracking-[0.18em] uppercase text-ink-faint m-0">
        This offer has ended
      </p>
    );
  }

  const spoken = UNITS.map(([key, label]) => `${parts[key]} ${label}`).join(", ");

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={
          "font-sans text-[10px] font-bold tracking-[0.24em] uppercase " +
          (overImage ? "text-white/80" : "text-pink")
        }
      >
        Ends in
      </span>
      {/* The digits change every second; announcing each one would drown out
          everything else, so screen readers get one label instead. */}
      <div className="flex gap-2" role="timer" aria-label={`Ends in ${spoken}`}>
        {UNITS.map(([key, label]) => (
          <span
            key={key}
            aria-hidden="true"
            className={
              "min-w-[58px] flex flex-col items-center py-2 px-1.5 rounded-xl border " +
              (overImage
                ? "border-white/20 bg-black/40 backdrop-blur-[6px] text-white"
                : "border-pink/25 bg-pink/[0.06] text-ink light:bg-pink/[0.05]")
            }
          >
            <span className="font-display text-[26px] leading-none tabular-nums">
              {String(parts[key]).padStart(2, "0")}
            </span>
            <span
              className={
                "mt-1 font-sans text-[9px] font-bold tracking-[0.16em] uppercase " +
                (overImage ? "text-white/70" : "text-ink-faint")
              }
            >
              {label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
