"use client";

import { useEffect, useState } from "react";
import { seasonAt } from "@/lib/seasonal/season";
import { cardPadded } from "@/components/admin/shared";

/** Site-wide on/off for seasonal effects. Loads and saves its own setting. */
export function SeasonalCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inSeason] = useState(() => seasonAt(new Date()) !== null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json: { seasonalEffects: boolean }) => setEnabled(json.seasonalEffects))
      .catch(() => setError("Couldn't load the setting."));
  }, []);

  const toggle = async () => {
    if (enabled === null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasonalEffects: !enabled }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEnabled(json.seasonalEffects);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't save the setting.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cardPadded}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] text-ink m-0">Seasonal effects</h2>
          <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5 max-w-[580px]">
            Snow falls across the shop from 1 December to 6 January
            {inSeason ? " — it's the season now." : "."} Shoppers can also hide it
            themselves. Changes reach the shop within a minute.
          </p>
          {error && <p className="font-sans text-[12px] text-pink m-0 mt-2">{error}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled === true}
          aria-label="Seasonal effects"
          disabled={enabled === null || busy}
          onClick={toggle}
          className="relative inline-flex items-center w-14 h-8 rounded-full border border-white/12 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-default aria-checked:bg-pink aria-[checked=false]:bg-white/[0.08]"
        >
          <span
            className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform duration-200 ${
              enabled ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}
