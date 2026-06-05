"use client";

import type { ReactNode } from "react";

export const money = (n: number) => `$${n.toFixed(2)}`;

export const cardClass =
  "rounded-[18px] border border-white/[0.06] bg-card light:border-[rgba(26,13,18,0.08)]";

export const fieldClass =
  "w-full h-12 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] " +
  "font-sans text-[15px] text-ink placeholder:text-ink-faint outline-none " +
  "transition-[border-color,background-color] duration-200 focus:border-pink focus:bg-pink/[0.04] " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";

export const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5";

export const btnSolid =
  "inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border-0 cursor-pointer " +
  "bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[11px] font-bold tracking-[0.12em] uppercase " +
  "shadow-[0_8px_20px_rgba(255,79,163,0.34),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
  "transition-transform duration-200 hover:-translate-y-px " +
  "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0";

/** A labelled form field. Renders the error message + red ring when `error` set. */
export function Field({
  label,
  htmlFor,
  required,
  optional,
  error,
  span2,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  error?: string | null;
  span2?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={span2 ? "col-span-2 max-[560px]:col-span-1" : ""}>
      <label className={labelClass} htmlFor={htmlFor}>
        {label}
        {required && <span className="text-pink"> *</span>}
        {optional && <span className="text-ink-faint font-medium normal-case tracking-normal"> (optional)</span>}
      </label>
      {children}
      {error && (
        <p className="font-sans text-[12px] text-[#ff8d8d] m-0 mt-1.5">{error}</p>
      )}
    </div>
  );
}

/** A numbered checkout section card (pink-gradient circle + Playfair heading). */
export function SectionCard({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={cardClass + " p-6 max-[560px]:p-5"}>
      <div className="flex items-center gap-3 mb-5">
        <span
          aria-hidden="true"
          className="flex-none w-8 h-8 rounded-full grid place-items-center font-sans text-[14px] font-bold text-white bg-gradient-to-br from-pink to-pink-deep"
        >
          {step}
        </span>
        <h2 className="font-serif text-[20px] font-semibold text-ink m-0">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/** Bag → Checkout → Confirmation progress row. */
export function StepIndicator({ current }: { current: "checkout" | "confirmation" }) {
  const steps = [
    { n: 1, label: "Bag", state: "done" as const },
    {
      n: 2,
      label: "Checkout",
      state: current === "checkout" ? ("active" as const) : ("done" as const),
    },
    {
      n: 3,
      label: "Confirmation",
      state: current === "confirmation" ? ("active" as const) : ("upcoming" as const),
    },
  ];

  return (
    <ol className="flex items-center gap-2 m-0 p-0 mb-5 list-none flex-wrap">
      {steps.map((s, i) => (
        <li key={s.n} className="flex items-center gap-2">
          <span
            className={
              "flex items-center gap-2 font-sans text-[11px] font-bold tracking-[0.12em] uppercase " +
              (s.state === "active"
                ? "text-blush"
                : s.state === "done"
                  ? "text-ink-dim"
                  : "text-ink-faint")
            }
          >
            <span
              className={
                "w-5 h-5 rounded-full grid place-items-center text-[10px] " +
                (s.state === "active"
                  ? "bg-pink text-white"
                  : s.state === "done"
                    ? "bg-pink/[0.18] text-blush"
                    : "border border-line-strong text-ink-faint")
              }
            >
              {s.state === "done" ? "✓" : s.n}
            </span>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="w-6 h-px bg-line-strong" />
          )}
        </li>
      ))}
    </ol>
  );
}

export function CheckmarkSpinner() {
  return (
    <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
  );
}
