"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type {
  SearchIndex,
  SearchIndexCategory,
} from "@/lib/queries/search";
import { searchCatalog } from "@/lib/search/match";
import { POPULAR_SEARCHES } from "@/lib/search/popular";

const PRODUCT_CAP = 6;
const RECENT_KEY = "sb-recent-searches";
const RECENT_MAX = 6;
const TRENDING_CAP = 4;
const SUGGESTED_CATEGORY_CAP = 5;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

type NavItem = {
  id: string;
  href: string;
  label: string;
};

export function SearchOverlay({
  index,
  onClose,
}: {
  index: SearchIndex | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [deferredQuery, setDeferredQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Focus the input, lock background scroll, and seed recent searches on open.
  useEffect(() => {
    inputRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Read localStorage after mount (SSR-safe) — deferred per the project's
    // React 19 no-sync-setState-in-effect convention.
    queueMicrotask(() => setRecent(loadRecent()));
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Debounce the query (~120ms) so typing feels instant without thrashing.
  useEffect(() => {
    const id = setTimeout(() => setDeferredQuery(query), 120);
    return () => clearTimeout(id);
  }, [query]);

  const results = useMemo(
    () => searchCatalog(index, deferredQuery),
    [index, deferredQuery],
  );
  const trimmed = deferredQuery.trim();
  const products = results.products.slice(0, PRODUCT_CAP);
  const categories = results.categories;

  // Flat list of keyboard-navigable options (products then categories).
  const items = useMemo<NavItem[]>(() => {
    const list: NavItem[] = [];
    results.products.slice(0, PRODUCT_CAP).forEach((h, i) =>
      list.push({
        id: `sopt-p-${i}`,
        href: `/products/${h.product.slug}`,
        label: h.product.name,
      }),
    );
    results.categories.forEach((c, i) =>
      list.push({
        id: `sopt-c-${i}`,
        href: `/products?category=${c.slug}`,
        label: c.name,
      }),
    );
    return list;
  }, [results]);

  // Auto-highlight the first result whenever the result set changes.
  useEffect(() => {
    queueMicrotask(() => setActiveIndex(items.length > 0 ? 0 : -1));
  }, [items]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (activeIndex < 0) return;
    const id = items[activeIndex]?.id;
    if (id) document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, items]);

  const recordRecent = useCallback((term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecent((prev) => {
      const next = [
        t,
        ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase()),
      ].slice(0, RECENT_MAX);
      saveRecent(next);
      return next;
    });
  }, []);

  const go = useCallback(
    (href: string) => {
      if (trimmed) recordRecent(trimmed);
      onClose();
      router.push(href);
    },
    [trimmed, recordRecent, onClose, router],
  );

  const applyTerm = useCallback((term: string) => {
    setQuery(term);
    setDeferredQuery(term);
    inputRef.current?.focus();
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    saveRecent([]);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    // Result navigation only applies while typing in the input — otherwise
    // Enter/Arrows on a focused chip would be hijacked into a result jump.
    const inInput = e.target === inputRef.current;
    if (inInput && e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (items.length ? (i + 1) % items.length : -1));
      return;
    }
    if (inInput && e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        items.length ? (i - 1 + items.length) % items.length : -1,
      );
      return;
    }
    if (inInput && e.key === "Enter") {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        go(items[activeIndex].href);
      } else if (trimmed) {
        e.preventDefault();
        recordRecent(trimmed);
      }
      return;
    }
    if (e.key === "Tab") {
      // Simple focus trap: wrap Tab within the panel.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const activeId =
    activeIndex >= 0 && items[activeIndex] ? items[activeIndex].id : undefined;
  const idle = trimmed === "";
  const loading = !idle && index === null;
  const zero = !idle && index !== null && results.total === 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Site search"
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[3px] animate-[fadeIn_180ms_ease]"
      />

      <div
        ref={panelRef}
        onKeyDown={onKeyDown}
        className={
          "relative z-[1] w-full max-w-[640px] mx-4 mt-[12vh] max-h-[76vh] flex flex-col overflow-hidden " +
          "animate-[searchPanelIn_200ms_cubic-bezier(0.2,0.8,0.2,1)] " +
          "rounded-[20px] border border-white/[0.08] light:border-[rgba(26,13,18,0.08)] " +
          "bg-[rgba(15,12,13,0.98)] light:bg-[rgba(253,247,244,0.99)] backdrop-blur-[20px] " +
          "shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,79,163,0.08)_inset] light:shadow-[0_32px_80px_rgba(180,120,140,0.25)] " +
          "max-[640px]:mt-0 max-[640px]:mx-0 max-[640px]:max-w-none max-[640px]:h-full max-[640px]:max-h-none max-[640px]:rounded-none"
        }
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] light:border-[rgba(26,13,18,0.06)]">
          <SearchGlyph />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="search-listbox"
            aria-activedescendant={activeId}
            aria-label="Search products and categories"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search jewelry, aftercare, categories…"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none font-sans text-[15px] text-ink placeholder:text-ink-faint"
          />
          <kbd className="hidden max-[640px]:inline-flex items-center font-sans text-[10px] tracking-[0.1em] uppercase text-ink-faint">
            <button type="button" onClick={onClose} aria-label="Close search">
              Close
            </button>
          </kbd>
          <kbd className="max-[640px]:hidden font-sans text-[10px] tracking-[0.08em] uppercase text-ink-faint border border-white/12 light:border-[rgba(26,13,18,0.12)] rounded-md px-1.5 py-1 leading-none">
            Esc
          </kbd>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          {idle && (
            <div className="flex flex-col gap-4 p-2">
              {recent.length > 0 && (
                <section>
                  <GroupHeading>
                    Recent
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="ml-auto font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-faint hover:text-pink"
                    >
                      Clear
                    </button>
                  </GroupHeading>
                  <ChipRow>
                    {recent.map((term) => (
                      <Chip key={term} onClick={() => applyTerm(term)}>
                        {term}
                      </Chip>
                    ))}
                  </ChipRow>
                </section>
              )}

              <section>
                <GroupHeading>Popular searches</GroupHeading>
                <ChipRow>
                  {POPULAR_SEARCHES.map((term) => (
                    <Chip key={term} onClick={() => applyTerm(term)}>
                      {term}
                    </Chip>
                  ))}
                </ChipRow>
              </section>

              {index && index.products.length > 0 && (
                <section>
                  <GroupHeading>Trending</GroupHeading>
                  <div className="flex flex-col">
                    {index.products.slice(0, TRENDING_CAP).map((p) => (
                      <ProductRow
                        key={p.id}
                        id={`trend-${p.id}`}
                        active={false}
                        query=""
                        name={p.name}
                        categoryName={p.categoryName}
                        imageUrl={p.imageUrl}
                        price={p.price}
                        compareAtPrice={p.compareAtPrice}
                        onSelect={() => go(`/products/${p.slug}`)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {loading && (
            <p className="p-6 text-center font-sans text-sm text-ink-faint">
              Loading catalog…
            </p>
          )}

          {zero && (
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <span aria-hidden="true" className="text-pink text-2xl leading-none">
                ✦
              </span>
              <p className="font-serif italic text-[17px] text-ink-dim m-0">
                No matches for “{trimmed}”. Try one of these instead.
              </p>
              {index && (
                <ChipRow className="justify-center">
                  {index.categories.slice(0, SUGGESTED_CATEGORY_CAP).map((c) => (
                    <Chip
                      key={c.slug}
                      onClick={() => go(`/products?category=${c.slug}`)}
                    >
                      {c.name}
                    </Chip>
                  ))}
                </ChipRow>
              )}
            </div>
          )}

          {!idle && !loading && !zero && (
            <div id="search-listbox" role="listbox" aria-label="Search results">
              {products.length > 0 && (
                <section>
                  <GroupHeading>
                    Products
                    <span className="ml-auto font-sans text-[11px] tracking-[0.04em] text-ink-faint">
                      {results.products.length}{" "}
                      {results.products.length === 1 ? "result" : "results"}
                    </span>
                  </GroupHeading>
                  <div className="flex flex-col">
                    {products.map((hit, i) => (
                      <ProductRow
                        key={hit.product.id}
                        id={items[i].id}
                        role="option"
                        active={activeIndex === i}
                        query={trimmed}
                        name={hit.product.name}
                        categoryName={hit.product.categoryName}
                        imageUrl={hit.product.imageUrl}
                        price={hit.product.price}
                        compareAtPrice={hit.product.compareAtPrice}
                        onSelect={() => go(items[i].href)}
                        onMouseEnter={() => setActiveIndex(i)}
                      />
                    ))}
                  </div>
                  {results.products.length > PRODUCT_CAP && (
                    <p className="px-3 py-2 font-sans text-[11px] tracking-[0.06em] text-ink-faint">
                      Showing {PRODUCT_CAP} of {results.products.length} — keep
                      typing to narrow down.
                    </p>
                  )}
                </section>
              )}

              {categories.length > 0 && (
                <section className="mt-1">
                  <GroupHeading>Categories</GroupHeading>
                  <div className="flex flex-col">
                    {categories.map((cat, j) => {
                      const idx = products.length + j;
                      return (
                        <CategoryRow
                          key={cat.slug}
                          id={items[idx].id}
                          active={activeIndex === idx}
                          query={trimmed}
                          category={cat}
                          onSelect={() => go(items[idx].href)}
                          onMouseEnter={() => setActiveIndex(idx)}
                        />
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="mt-1">
                <GroupHeading>Suggestions</GroupHeading>
                <ChipRow>
                  {POPULAR_SEARCHES.map((term) => (
                    <Chip key={term} onClick={() => applyTerm(term)}>
                      {term}
                    </Chip>
                  ))}
                </ChipRow>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Presentational helpers ────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent text-pink font-semibold">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-1.5 font-serif text-[13px] text-ink-dim">
      {children}
    </div>
  );
}

function ChipRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 px-3 pb-1 ${className}`}>{children}</div>
  );
}

function Chip({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center py-2 px-3.5 rounded-full border min-h-[36px] " +
        "font-sans text-xs font-medium tracking-[0.06em] no-underline " +
        "border-white/12 light:border-[rgba(26,13,18,0.12)] text-ink-dim " +
        "transition-colors duration-200 hover:border-blush hover:text-ink"
      }
    >
      {children}
    </button>
  );
}

function Price({
  price,
  compareAtPrice,
}: {
  price: number;
  compareAtPrice: number | null;
}) {
  return (
    <span className="flex items-baseline gap-1.5 shrink-0">
      {compareAtPrice && compareAtPrice > price && (
        <span className="font-sans text-[12px] text-ink-faint line-through">
          ${compareAtPrice.toFixed(2)}
        </span>
      )}
      <span className="font-serif text-[15px] font-semibold text-ink">
        ${price.toFixed(2)}
      </span>
    </span>
  );
}

function RowShell({
  id,
  role,
  active,
  onSelect,
  onMouseEnter,
  children,
}: {
  id: string;
  role?: "option";
  active: boolean;
  onSelect: () => void;
  onMouseEnter?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      role={role}
      aria-selected={role === "option" ? active : undefined}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={
        "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border-l-2 min-h-[44px] " +
        (active
          ? "bg-pink/[0.08] border-pink"
          : "border-transparent hover:bg-white/[0.04] light:hover:bg-[rgba(26,13,18,0.04)]")
      }
    >
      {children}
    </div>
  );
}

function Thumb({
  imageUrl,
  alt,
}: {
  imageUrl: string | null;
  alt: string;
}) {
  return (
    <span className="relative block w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-canvas-2">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="44px"
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-pink to-pink-deep"
        />
      )}
    </span>
  );
}

function ProductRow({
  id,
  role,
  active,
  query,
  name,
  categoryName,
  imageUrl,
  price,
  compareAtPrice,
  onSelect,
  onMouseEnter,
}: {
  id: string;
  role?: "option";
  active: boolean;
  query: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  onSelect: () => void;
  onMouseEnter?: () => void;
}) {
  return (
    <RowShell
      id={id}
      role={role}
      active={active}
      onSelect={onSelect}
      onMouseEnter={onMouseEnter}
    >
      <Thumb imageUrl={imageUrl} alt={name} />
      <span className="flex flex-col min-w-0 flex-1">
        <span className="font-serif text-[15px] leading-tight text-ink truncate">
          <Highlight text={name} query={query} />
        </span>
        <span className="font-sans text-[11px] tracking-[0.1em] uppercase text-ink-faint truncate">
          {categoryName}
        </span>
      </span>
      <Price price={price} compareAtPrice={compareAtPrice} />
    </RowShell>
  );
}

function CategoryRow({
  id,
  active,
  query,
  category,
  onSelect,
  onMouseEnter,
}: {
  id: string;
  active: boolean;
  query: string;
  category: SearchIndexCategory;
  onSelect: () => void;
  onMouseEnter?: () => void;
}) {
  return (
    <RowShell
      id={id}
      role="option"
      active={active}
      onSelect={onSelect}
      onMouseEnter={onMouseEnter}
    >
      <span className="flex items-center justify-center w-11 h-11 shrink-0 rounded-lg bg-pink/[0.08] text-pink">
        <TagGlyph />
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className="font-serif text-[15px] leading-tight text-ink truncate">
          <Highlight text={category.name} query={query} />
        </span>
        {category.description && (
          <span className="font-sans text-[12px] text-ink-faint truncate">
            {category.description}
          </span>
        )}
      </span>
    </RowShell>
  );
}

function SearchGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-5 h-5 shrink-0 text-ink-faint"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function TagGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-[18px] h-[18px]"
    >
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.2" />
    </svg>
  );
}
