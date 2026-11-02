"use client";

import { useState, type FormEvent } from "react";
import type { NewsletterSource } from "@/lib/newsletter/validate";
import { useNewsletterSignup } from "./use-newsletter-signup";

export const popupCtaClass =
  "inline-flex w-full items-center justify-center gap-2.5 py-3.5 px-6 rounded-full border-0 cursor-pointer no-underline " +
  "bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[13px] font-bold tracking-[0.14em] uppercase " +
  "shadow-[0_8px_22px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
  "transition-[transform,box-shadow,gap] duration-200 hover:-translate-y-px hover:gap-3 " +
  "hover:shadow-[0_12px_28px_rgba(255,79,163,0.5),0_0_0_1px_rgba(255,255,255,0.16)_inset] " +
  "disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none";

/**
 * Email field + join button for a newsletter popup. On success it swaps to a
 * thank-you and, when the popup carries one, the promo code with a copy button.
 */
export function PopupNewsletterForm({
  popupId,
  source,
  defaultEmail = "",
  hasReward,
  overImage = false,
  preview = false,
}: {
  popupId: string;
  source: NewsletterSource;
  defaultEmail?: string;
  hasReward: boolean;
  overImage?: boolean;
  /** Admin preview: looks real, submits nothing. */
  preview?: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [copied, setCopied] = useState(false);
  const { status, error, promoCode, submit } = useNewsletterSignup(source, popupId);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!preview) submit(email);
  };

  const copy = async () => {
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused (insecure context, permissions): the code is on
      // screen and selectable, which is enough.
    }
  };

  if (status === "done") {
    return (
      <div className="w-full flex flex-col items-center gap-3" role="status">
        <p className={"font-serif italic text-lg m-0 " + (overImage ? "text-white" : "text-blush")}>
          You&apos;re on the list, sweet berry.
        </p>
        {promoCode && (
          <div className="w-full flex flex-col items-center gap-2">
            <span
              className={
                "font-sans text-[10px] font-bold tracking-[0.24em] uppercase " +
                (overImage ? "text-white/80" : "text-ink-faint")
              }
            >
              Your code
            </span>
            <div className="w-full flex items-center gap-2 p-1.5 pl-5 rounded-full border border-dashed border-pink/60 bg-pink/[0.08]">
              <code
                className={
                  "flex-1 min-w-0 truncate text-left font-mono text-[17px] font-bold tracking-[0.16em] select-all " +
                  (overImage ? "text-white" : "text-ink")
                }
              >
                {promoCode}
              </code>
              <button
                type="button"
                onClick={copy}
                className="shrink-0 py-2.5 px-4 rounded-full border-0 cursor-pointer bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[11px] font-bold tracking-[0.12em] uppercase"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <span className={"font-sans text-[12px] " + (overImage ? "text-white/75" : "text-ink-dim")}>
              Enter it at checkout on your next order.
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full flex flex-col gap-2.5">
      <input
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email address"
        className={
          "w-full py-3.5 px-5 rounded-full border outline-none font-sans text-[16px] " +
          "transition-[border-color] duration-200 focus:border-pink " +
          (overImage
            ? "border-white/25 bg-black/45 backdrop-blur-[6px] text-white placeholder:text-white/60"
            : "border-white/12 bg-white/[0.04] text-ink placeholder:text-ink-faint light:bg-white light:border-[rgba(26,13,18,0.14)]")
        }
      />
      <button type="submit" disabled={status === "submitting"} className={popupCtaClass}>
        {status === "submitting" ? "Joining…" : hasReward ? "Join & get my code" : "Join the list"}
        <span aria-hidden="true">→</span>
      </button>
      {error && (
        <p role="alert" className="font-sans text-[13px] text-[#ff8d8d] m-0 text-center">
          {error}
        </p>
      )}
      <p className={"font-sans text-[11px] m-0 text-center " + (overImage ? "text-white/70" : "text-ink-faint")}>
        Never too often. Unsubscribe anytime.
      </p>
    </form>
  );
}
