"use client";

import Link from "next/link";
import type { NewsletterSource } from "@/lib/newsletter/validate";
import type { PublicPopup } from "@/lib/popups/schedule";
import { PopupCountdown } from "./popup-countdown";
import { PopupNewsletterForm, popupCtaClass } from "./popup-newsletter-form";

/**
 * The popup itself, in either layout. Purely presentational so the admin form
 * can render the exact same card as its live preview.
 *
 * Images are plain <img>: the admin can paste any host, and next/image throws
 * for hosts missing from next.config's remotePatterns.
 */
export function PopupCard({
  popup,
  source,
  defaultEmail,
  onClose,
  onCountdownEnd,
  preview = false,
}: {
  popup: PublicPopup;
  source: NewsletterSource;
  defaultEmail?: string;
  onClose: () => void;
  onCountdownEnd?: () => void;
  preview?: boolean;
}) {
  const full = popup.layout === "FULL_GRAPHIC" && !!popup.imageUrl;

  const countdown =
    popup.showCountdown && popup.endsAt ? (
      <PopupCountdown endsAt={popup.endsAt} onEnd={onCountdownEnd} overImage={full} />
    ) : null;

  const action =
    popup.kind === "NEWSLETTER" ? (
      <PopupNewsletterForm
        popupId={popup.id}
        source={source}
        defaultEmail={defaultEmail}
        hasReward={popup.hasReward}
        overImage={full}
        preview={preview}
      />
    ) : popup.ctaLabel && popup.ctaHref ? (
      <PopupCta href={popup.ctaHref} label={popup.ctaLabel} onClick={onClose} preview={preview} />
    ) : null;

  const closeButton = (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="absolute top-3 right-3 z-10 w-9 h-9 grid place-items-center rounded-full border border-white/20 bg-black/45 backdrop-blur-[6px] text-white cursor-pointer transition-colors hover:bg-black/65 hover:border-blush"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );

  const shell =
    "relative w-full max-h-[calc(100dvh-32px)] overflow-y-auto overflow-x-hidden rounded-[28px] border border-pink/[0.28] " +
    "bg-[rgba(15,12,13,0.97)] light:bg-[rgba(253,247,244,0.99)] " +
    "shadow-[0_30px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset,0_30px_100px_rgba(255,79,163,0.2)] " +
    "light:shadow-[0_30px_80px_rgba(180,120,140,0.3)]";

  if (full) {
    // The words are part of the artwork, so the headline becomes its alt text
    // and the site only adds what has to be live: countdown, button, form.
    return (
      <div className={shell}>
        {closeButton}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={popup.imageUrl!} alt={popup.headline} className="block w-full h-auto" />
          {(countdown || action) && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-5 pb-5 pt-20 bg-gradient-to-t from-black/85 via-black/50 to-transparent">
              {countdown}
              {action}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      {closeButton}
      {popup.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={popup.imageUrl} alt="" className="block w-full aspect-[3/2] object-cover" />
      )}
      <div
        className={
          "relative flex flex-col items-center text-center px-7 pb-7 " +
          (popup.imageUrl ? "pt-6" : "pt-12")
        }
      >
        {/* Soft glow behind the words, as on the homepage Berry List card. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[320px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(255,79,163,0.18),transparent_70%)]"
        />
        <h2 className="relative font-display text-[clamp(28px,7vw,36px)] leading-[1.08] tracking-[-0.01em] text-ink m-0">
          {popup.headline}
        </h2>
        {popup.body && (
          <p className="relative font-sans text-[15px] leading-[1.6] text-ink-dim mt-3 mb-0 whitespace-pre-line">
            {popup.body}
          </p>
        )}
        {countdown && <div className="relative mt-5">{countdown}</div>}
        {action && <div className="relative w-full mt-6">{action}</div>}
        <button
          type="button"
          onClick={onClose}
          className="relative mt-4 bg-transparent border-0 cursor-pointer p-0 font-sans text-[12px] tracking-[0.08em] text-ink-faint underline-offset-4 hover:text-ink hover:underline"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function PopupCta({
  href,
  label,
  onClick,
  preview,
}: {
  href: string;
  label: string;
  onClick: () => void;
  preview: boolean;
}) {
  const content = (
    <>
      {label} <span aria-hidden="true">→</span>
    </>
  );
  if (preview) {
    return (
      <span className={popupCtaClass} title={href}>
        {content}
      </span>
    );
  }
  // An outside link opens in a new tab so the shop stays open behind it.
  if (/^https:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={popupCtaClass}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={popupCtaClass}>
      {content}
    </Link>
  );
}
