"use client";

import { useEffect, useMemo, useState } from "react";
import type { TrendPoint, CategorySale, Channel } from "@/lib/queries/admin";
import { money0 } from "@/components/admin/shared";

// -----------------------------------------------------------------------------
// Revenue area chart — hand-drawn inline SVG with gradient fill, line, hover
// dots and a floating tooltip. No chart library.
// -----------------------------------------------------------------------------

const VBW = 720;
const VBH = 260;
const PADX = 14;
const PADT = 18;
const PADB = 30;

export function RevenueAreaChart({ data }: { data: TrendPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 40);
    return () => clearTimeout(t);
  }, []);

  const geo = useMemo(() => {
    const n = Math.max(data.length, 1);
    const plotW = VBW - PADX * 2;
    const plotH = VBH - PADT - PADB;
    const baseline = VBH - PADB;
    const max = Math.max(...data.map((d) => d.revenue), 1);
    const step = n > 1 ? plotW / (n - 1) : 0;
    const pts = data.map((d, i) => ({
      x: PADX + i * step,
      y: baseline - (d.revenue / max) * plotH,
      ...d,
    }));
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const area =
      pts.length > 0
        ? `${line} L${pts[pts.length - 1].x.toFixed(1)} ${baseline} L${pts[0].x.toFixed(1)} ${baseline} Z`
        : "";
    return { pts, line, area, baseline, max, plotH };
  }, [data]);

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => PADT + f * geo.plotH);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        preserveAspectRatio="none"
        className="w-full h-[260px] block"
        role="img"
        aria-label="Revenue over the last 12 months"
      >
        <defs>
          <linearGradient id="adm-rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-pink)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--color-pink)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridYs.map((y, i) => (
          <line
            key={i}
            x1={PADX}
            x2={VBW - PADX}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.07"
            strokeWidth="1"
            className="text-ink"
          />
        ))}

        <path
          d={geo.area}
          fill="url(#adm-rev-fill)"
          style={{ opacity: grown ? 1 : 0, transition: "opacity 0.8s ease" }}
        />
        <path
          d={geo.line}
          fill="none"
          stroke="var(--color-pink)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 2000,
            strokeDashoffset: grown ? 0 : 2000,
            transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)",
          }}
        />

        {geo.pts.map((p, i) => (
          <g key={i}>
            {active === i && (
              <line
                x1={p.x}
                x2={p.x}
                y1={PADT}
                y2={geo.baseline}
                stroke="var(--color-pink)"
                strokeOpacity="0.4"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={active === i ? 5 : 3}
              fill={active === i ? "var(--color-pink)" : "var(--color-canvas)"}
              stroke="var(--color-pink)"
              strokeWidth="2"
              style={{ opacity: grown ? 1 : 0, transition: "opacity 0.6s ease 0.5s" }}
            />
            {/* Invisible hover band per point. */}
            <rect
              x={p.x - (VBW - PADX * 2) / Math.max(geo.pts.length, 1) / 2}
              y={0}
              width={(VBW - PADX * 2) / Math.max(geo.pts.length, 1)}
              height={VBH}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((cur) => (cur === i ? null : cur))}
            />
            <text
              x={p.x}
              y={VBH - 9}
              textAnchor="middle"
              className="fill-ink-faint font-sans"
              style={{ fontSize: 13 }}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {active !== null && geo.pts[active] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[115%] whitespace-nowrap rounded-xl border border-pink/30 bg-[rgba(15,12,13,0.96)] px-3 py-2 shadow-[0_14px_30px_rgba(0,0,0,0.5)] light:bg-white light:border-[rgba(26,13,18,0.12)]"
          style={{
            left: `${(geo.pts[active].x / VBW) * 100}%`,
            top: `${(geo.pts[active].y / VBH) * 100}%`,
          }}
        >
          <div className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            {geo.pts[active].full}
          </div>
          <div className="font-display text-[18px] leading-tight text-ink">
            {money0(geo.pts[active].revenue)}
          </div>
          <div className="font-sans text-[11px] text-blush">{geo.pts[active].orders} orders</div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sales-by-category horizontal bars with animated fills.
// -----------------------------------------------------------------------------

export function CategoryBars({ items }: { items: CategorySale[] }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 60);
    return () => clearTimeout(t);
  }, []);
  const max = Math.max(...items.map((i) => i.revenue), 1);

  return (
    <ul className="flex flex-col gap-4">
      {items.map((c) => (
        <li key={c.name}>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="font-sans text-[13px] text-ink-dim truncate">{c.name}</span>
            <span className="font-sans text-[12px] text-ink-faint shrink-0">
              {money0(c.revenue)} · {c.pct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden light:bg-[rgba(26,13,18,0.06)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink to-gold"
              style={{
                width: grown ? `${(c.revenue / max) * 100}%` : "0%",
                transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// -----------------------------------------------------------------------------
// Acquisition donut — pure SVG stroke-dasharray segments + legend.
// -----------------------------------------------------------------------------

const R = 54;
const C = 2 * Math.PI * R;

export function AcquisitionDonut({ items }: { items: Channel[] }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 60);
    return () => clearTimeout(t);
  }, []);

  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  const segs = items.map((it, i) => {
    const prior = items.slice(0, i).reduce((s, x) => s + x.value, 0);
    const frac = it.value / total;
    return { ...it, dash: frac * C, offset: -(prior / total) * C };
  });
  const top = [...items].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
        <svg viewBox="0 0 140 140" width="140" height="140" aria-label="Acquisition channels">
          <g transform="rotate(-90 70 70)">
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="18"
              className="text-ink"
            />
            {segs.map((s) => (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeDasharray={`${grown ? s.dash : 0} ${C}`}
                strokeDashoffset={s.offset}
                style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)" }}
              />
            ))}
          </g>
        </svg>
        {top && (
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="font-display text-[22px] leading-none text-ink">{top.value}%</div>
              <div className="font-sans text-[10px] uppercase tracking-[0.12em] text-ink-faint mt-1">
                {top.label}
              </div>
            </div>
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-2.5 min-w-[140px] flex-1">
        {items.map((c) => (
          <li key={c.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-sans text-[13px] text-ink-dim">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: c.color }}
                aria-hidden="true"
              />
              {c.label}
            </span>
            <span className="font-sans text-[12px] text-ink-faint">{c.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Inline share bar (top-products table).
// -----------------------------------------------------------------------------

export function ShareBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full max-w-[120px] rounded-full bg-white/[0.06] overflow-hidden light:bg-[rgba(26,13,18,0.06)]">
        <div className="h-full rounded-full bg-gradient-to-r from-pink to-pink-deep" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-sans text-[11px] text-ink-faint w-9 text-right">{pct}%</span>
    </div>
  );
}
