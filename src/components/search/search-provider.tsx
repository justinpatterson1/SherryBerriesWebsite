"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { SearchIndex } from "@/lib/queries/search";
import { SearchOverlay } from "./search-overlay";

type SearchContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const SearchContext = createContext<SearchContextValue | null>(null);

// Safe no-op default so a stray `useSearch()` outside the provider (or on
// /admin, where search is disabled) never throws.
const NOOP: SearchContextValue = {
  open: () => {},
  close: () => {},
  isOpen: false,
};

export function useSearch(): SearchContextValue {
  return useContext(SearchContext) ?? NOOP;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The admin control room has its own chrome — no store search there.
  const enabled = !pathname?.startsWith("/admin");

  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const fetchedRef = useRef(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Lazy-load the catalog index the first time search opens; retry on failure.
  useEffect(() => {
    if (!isOpen || fetchedRef.current) return;
    fetchedRef.current = true;
    let alive = true;
    fetch("/api/search")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data) setIndex(data as SearchIndex);
        else fetchedRef.current = false;
      })
      .catch(() => {
        fetchedRef.current = false;
      });
    return () => {
      alive = false;
    };
  }, [isOpen]);

  // Global shortcuts: "/" or Cmd/Ctrl-K opens the overlay.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const slash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey;
      if (!cmdK && !slash) return;
      // "/" must not hijack typing; Cmd/Ctrl-K is intentional even in fields.
      const t = e.target as HTMLElement | null;
      const typing =
        !!t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      if (slash && typing) return;
      e.preventDefault();
      setIsOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  return (
    <SearchContext.Provider value={{ open, close, isOpen: isOpen && enabled }}>
      {children}
      {enabled && isOpen && <SearchOverlay index={index} onClose={close} />}
    </SearchContext.Provider>
  );
}
