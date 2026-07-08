"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TESTIMONIALS, type Testimonial } from "@/lib/home/testimonials";

const GAP = 22; // px gap between cards (matches the bestsellers grid)
const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 40; // px

// ≤640 → 1 card, ≤1024 → 2, else 3.
function perPageFor(width: number): number {
  if (width <= 640) return 1;
  if (width <= 1024) return 2;
  return 3;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span
      aria-label={`${rating} out of 5 stars`}
      className="text-gold tracking-[2px] text-sm leading-none"
    >
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

function Avatar({ name, img }: { name: string; img?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const base =
    "flex-none w-11 h-11 rounded-full overflow-hidden grid place-items-center " +
    "font-sans text-sm font-bold text-white " +
    "bg-gradient-to-br from-pink to-pink-deep " +
    "ring-1 ring-white/15 light:ring-[rgba(26,13,18,0.12)]";

  if (img && !failed) {
    return (
      // Plain <img> (not next/image) so arbitrary avatar hosts don't need
      // next.config remotePatterns — same call made for admin thumbnails.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={img}
        alt={name}
        onError={() => setFailed(true)}
        className={`${base} object-cover`}
      />
    );
  }
  return (
    <span className={base} aria-hidden="true">
      {initials}
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 font-sans text-[10.5px] font-semibold tracking-[0.1em] uppercase text-pink">
      <span
        aria-hidden="true"
        className="grid place-items-center w-4 h-4 rounded-full bg-pink text-white text-[9px] leading-none"
      >
        ✓
      </span>
      Verified buyer
    </span>
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <article
      className={
        "h-full flex flex-col gap-5 rounded-[18px] bg-card border border-white/[0.06] p-7 " +
        "light:border-[rgba(26,13,18,0.08)] " +
        "transition-[border-color,box-shadow] duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
        "hover:border-pink hover:shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,79,163,0.18)_inset]"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <Stars rating={t.rating} />
        <VerifiedBadge />
      </div>

      <blockquote className="m-0 font-serif text-[19px] leading-[1.5] text-ink-dim">
        <span className="text-pink/70 font-serif text-2xl leading-none mr-0.5">“</span>
        {t.quote}
      </blockquote>

      <div className="mt-auto flex items-center gap-3.5 pt-1">
        <Avatar name={t.name} img={t.img} />
        <div className="flex flex-col leading-tight">
          <span className="font-sans text-sm font-semibold text-ink">{t.name}</span>
          <span className="font-sans text-xs text-ink-faint">
            {t.loc} · {t.date}
          </span>
        </div>
      </div>
    </article>
  );
}

function Arrow({
  dir,
  onClick,
  disabled,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous reviews" : "Next reviews"}
      className={
        "w-11 h-11 rounded-full grid place-items-center " +
        "border border-white/[0.14] bg-white/[0.03] text-ink " +
        "light:border-[rgba(26,13,18,0.14)] light:bg-[rgba(26,13,18,0.03)] " +
        "transition-[background-color,border-color,opacity,transform] duration-200 " +
        "enabled:hover:border-pink enabled:hover:text-pink enabled:hover:-translate-y-0.5 " +
        "disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      }
    >
      <span aria-hidden="true" className="text-lg leading-none">
        {dir === "prev" ? "‹" : "›"}
      </span>
    </button>
  );
}

export function Testimonials() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [perPage, setPerPage] = useState(3);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragX = useRef<number | null>(null);

  const pageCount = Math.max(1, Math.ceil(TESTIMONIALS.length / perPage));
  const maxPage = pageCount - 1;

  // Measure the viewport (px) + derive cards-per-page on mount and resize.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      setWidth(el.clientWidth);
      setPerPage(perPageFor(window.innerWidth));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Keep the current page in range when the layout (and so pageCount) changes.
  useEffect(() => {
    queueMicrotask(() => setPage((p) => (p > maxPage ? maxPage : p)));
  }, [maxPage]);

  // Autoplay: advance every 6s, looping back to the first page. Paused on hover.
  useEffect(() => {
    if (paused || maxPage === 0) return;
    const id = setInterval(() => {
      setPage((p) => (p >= maxPage ? 0 : p + 1));
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, maxPage]);

  const prev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const next = useCallback(
    () => setPage((p) => Math.min(maxPage, p + 1)),
    [maxPage],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragX.current === null) return;
    const dx = e.clientX - dragX.current;
    dragX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) next();
    else prev();
  };

  // One page = the full viewport width plus one gap (cards fill the viewport
  // exactly, so the next page begins after width + gap).
  const offset = page * (width + GAP);

  return (
    <section
      aria-labelledby="reviews-title"
      aria-roledescription="carousel"
      className="pt-[60px] pb-[100px] px-[8%] relative max-[600px]:pt-10 max-[600px]:pb-20 max-[600px]:px-[6%]"
    >
      <div className="flex items-end justify-between gap-6 mb-12 max-[600px]:mb-8">
        <div className="flex flex-col gap-3.5 max-w-[640px]">
          <span className="font-sans text-[13px] font-medium tracking-[0.22em] uppercase text-pink">
            Reviews · Verified buyers
          </span>
          <h2
            id="reviews-title"
            className="font-display text-[clamp(36px,4.5vw,56px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
          >
            Loved by the{" "}
            <span className="font-serif italic text-blush">sweetest</span> berries.
          </h2>
          <p className="font-sans text-base leading-[1.6] text-ink-dim m-0">
            Real words from {TESTIMONIALS.length}{" "}
            verified SherryBerries customers across Trinidad &amp; Tobago.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 max-[600px]:hidden">
          <Arrow dir="prev" onClick={prev} disabled={page === 0} />
          <Arrow dir="next" onClick={next} disabled={page === maxPage} />
        </div>
      </div>

      <div
        ref={viewportRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing select-none [touch-action:pan-y]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex transition-transform duration-[550ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ gap: `${GAP}px`, transform: `translateX(-${offset}px)` }}
        >
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              style={{ flex: `0 0 calc((100% - ${(perPage - 1) * GAP}px) / ${perPage})` }}
            >
              <Card t={t} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2.5 mt-9">
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPage(i)}
            aria-label={`Go to review page ${i + 1}`}
            aria-current={page === i}
            className={
              "h-2 rounded-full transition-[width,background-color] duration-300 cursor-pointer " +
              (page === i
                ? "w-7 bg-gradient-to-r from-pink to-pink-deep"
                : "w-2 bg-white/20 hover:bg-white/40 light:bg-[rgba(26,13,18,0.18)]")
            }
          />
        ))}
      </div>

      {/* Mobile arrows below the dots (header arrows are hidden <600px). */}
      <div className="hidden max-[600px]:flex items-center justify-center gap-3 mt-6">
        <Arrow dir="prev" onClick={prev} disabled={page === 0} />
        <Arrow dir="next" onClick={next} disabled={page === maxPage} />
      </div>
    </section>
  );
}
