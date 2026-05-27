"use client";

import { useState, type ReactNode } from "react";

type Section = {
  key: string;
  title: string;
  body: ReactNode;
};

export function ProductAccordion({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState<string>(sections[0]?.key ?? "");

  return (
    <div className="flex flex-col divide-y divide-white/[0.06] light:divide-[rgba(26,13,18,0.08)]">
      {sections.map((s) => {
        const isOpen = open === s.key;
        return (
          <div key={s.key}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? "" : s.key)}
              className={
                "w-full flex items-center justify-between py-5 text-left " +
                "font-serif text-[20px] font-semibold text-ink bg-transparent border-0 cursor-pointer " +
                "transition-colors duration-200 hover:text-pink"
              }
            >
              <span>{s.title}</span>
              <span
                aria-hidden="true"
                className={
                  "inline-flex w-7 h-7 items-center justify-center rounded-full border border-white/12 text-ink-dim " +
                  "transition-[transform,color,border-color] duration-[260ms] " +
                  (isOpen ? "rotate-45 text-pink border-pink" : "")
                }
              >
                <PlusIcon />
              </span>
            </button>
            <div
              className={
                "grid transition-[grid-template-rows] duration-[300ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
                (isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
              }
            >
              <div className="overflow-hidden">
                <div className="pb-6 pr-2 font-sans text-[15px] leading-[1.7] text-ink-dim">
                  {s.body}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-3.5 h-3.5">
      <path d="M8 2v12M2 8h12" />
    </svg>
  );
}
