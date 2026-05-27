"use client";

import { useSession } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type WishlistContextValue = {
  ids: Set<string>;
  count: number;
  ready: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (
    productId: string,
  ) => Promise<{ ok: boolean; inWishlist?: boolean; error?: string }>;
};

const STORAGE_KEY = "sb-wishlist";
const WishlistContext = createContext<WishlistContextValue | null>(null);

function readGuestList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function writeGuestList(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage may be unavailable
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      if (loadedFor.current === "auth") return;
      loadedFor.current = "auth";
      fetch("/api/wishlist")
        .then((r) => r.json())
        .then((data: { items: string[] }) => {
          setIds(new Set(data.items));
          setReady(true);
        })
        .catch(() => setReady(true));
    } else {
      loadedFor.current = "guest";
      queueMicrotask(() => {
        setIds(new Set(readGuestList()));
        setReady(true);
      });
    }
  }, [status]);

  const isWishlisted = useCallback(
    (productId: string) => ids.has(productId),
    [ids],
  );

  const toggle = useCallback<WishlistContextValue["toggle"]>(
    async (productId) => {
      if (status === "authenticated") {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { ok: false, error: body.error || "Couldn't update wishlist." };
        }
        const data = (await res.json()) as { inWishlist: boolean };
        setIds((prev) => {
          const next = new Set(prev);
          if (data.inWishlist) next.add(productId);
          else next.delete(productId);
          return next;
        });
        return { ok: true, inWishlist: data.inWishlist };
      }

      // Guest path — localStorage toggle.
      let nextState = false;
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
          nextState = false;
        } else {
          next.add(productId);
          nextState = true;
        }
        writeGuestList(Array.from(next));
        return next;
      });
      return { ok: true, inWishlist: nextState };
    },
    [status],
  );

  const value = useMemo(
    () => ({ ids, count: ids.size, ready, isWishlisted, toggle }),
    [ids, ready, isWishlisted, toggle],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      ids: new Set<string>(),
      count: 0,
      ready: false,
      isWishlisted: () => false,
      toggle: async () => ({ ok: false, error: "Wishlist unavailable." }),
    } satisfies WishlistContextValue;
  }
  return ctx;
}
