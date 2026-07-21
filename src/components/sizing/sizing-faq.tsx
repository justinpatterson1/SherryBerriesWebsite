"use client";

import { useState } from "react";
import { SIZING_FAQS } from "@/lib/sizing/data";

export function SizingFaq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col border-t border-line max-w-[820px]">
      {SIZING_FAQS.map((item, i) => {
        const isOpen = open === i;
        const panelId = `sizing-faq-panel-${i}`;
        return (
          <div key={item.q} className="border-b border-line">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className={
                "w-full flex items-center justify-between gap-6 py-6 px-1 " +
                "bg-transparent border-0 cursor-pointer text-left " +
                "font-serif text-[22px] font-medium text-ink " +
                "transition-colors duration-200 hover:text-pink " +
                "max-[600px]:text-[19px] max-[600px]:py-5 max-[600px]:px-0.5"
              }
            >
              <span>{item.q}</span>
              <span
                aria-hidden="true"
                className={
                  "relative shrink-0 w-9 h-9 rounded-full inline-flex items-center justify-center " +
                  "border border-white/[0.14] bg-white/[0.03] text-ink-dim " +
                  "transition-[transform,background-color,color,border-color] duration-[360ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
                  "light:border-[rgba(26,13,18,0.14)] light:bg-[rgba(26,13,18,0.03)] " +
                  "before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 " +
                  "before:w-3 before:h-[1.5px] before:bg-current before:rounded " +
                  "after:content-[''] after:absolute after:top-1/2 after:left-1/2 " +
                  "after:w-3 after:h-[1.5px] after:bg-current after:rounded " +
                  "after:[transform:translate(-50%,-50%)_rotate(90deg)] " +
                  (isOpen
                    ? "[transform:rotate(45deg)] bg-gradient-to-br from-pink to-pink-deep !border-transparent !text-white"
                    : "")
                }
              />
            </button>
            <div
              id={panelId}
              role="region"
              className={
                "overflow-hidden transition-[max-height] duration-[420ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
                (isOpen ? "max-h-[400px]" : "max-h-0")
              }
            >
              <p className="pl-1 pr-1 pb-[26px] font-sans text-[17px] leading-[1.65] text-ink-dim m-0">
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
