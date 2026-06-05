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

export type CartLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

type LineKey = { productId: string; variantId: string | null };

type CartContextValue = {
  items: CartLine[];
  count: number;
  ready: boolean;
  addItem: (line: CartLine) => Promise<{ ok: boolean; error?: string }>;
  updateQuantity: (
    key: LineKey,
    quantity: number,
  ) => Promise<{ ok: boolean; error?: string }>;
  removeLine: (key: LineKey) => Promise<{ ok: boolean; error?: string }>;
  clearCart: () => void;
};

const STORAGE_KEY = "sb-cart";
const CartContext = createContext<CartContextValue | null>(null);

function readGuestCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartLine[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // session storage may be unavailable (private mode, quota); cart simply won't persist
  }
}

function mergeLine(items: CartLine[], line: CartLine): CartLine[] {
  const idx = items.findIndex(
    (it) => it.productId === line.productId && it.variantId === line.variantId,
  );
  if (idx === -1) return [...items, line];
  const next = [...items];
  next[idx] = {
    ...next[idx],
    quantity: Math.min(10, next[idx].quantity + line.quantity),
  };
  return next;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      if (loadedFor.current === "auth") return;
      loadedFor.current = "auth";
      fetch("/api/cart")
        .then((r) => r.json())
        .then((data: { items: Array<CartLine & { id?: string }> }) => {
          setItems(
            data.items.map((it) => ({
              productId: it.productId,
              variantId: it.variantId,
              quantity: it.quantity,
            })),
          );
          setReady(true);
        })
        .catch(() => setReady(true));
    } else {
      loadedFor.current = "guest";
      queueMicrotask(() => {
        setItems(readGuestCart());
        setReady(true);
      });
    }
  }, [status]);

  const addItem = useCallback<CartContextValue["addItem"]>(
    async (line) => {
      if (status === "authenticated") {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(line),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { ok: false, error: body.error || "Couldn't add to cart." };
        }
        setItems((prev) => mergeLine(prev, line));
        return { ok: true };
      }

      // Guest path — sessionStorage only.
      setItems((prev) => {
        const next = mergeLine(prev, line);
        writeGuestCart(next);
        return next;
      });
      return { ok: true };
    },
    [status],
  );

  const updateQuantity = useCallback<CartContextValue["updateQuantity"]>(
    async ({ productId, variantId }, quantity) => {
      const clamped = Math.max(1, Math.min(10, Math.floor(quantity)));

      if (status === "authenticated") {
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantId, quantity: clamped }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { ok: false, error: body.error || "Couldn't update quantity." };
        }
        setItems((prev) =>
          prev.map((it) =>
            it.productId === productId && it.variantId === variantId
              ? { ...it, quantity: clamped }
              : it,
          ),
        );
        return { ok: true };
      }

      setItems((prev) => {
        const next = prev.map((it) =>
          it.productId === productId && it.variantId === variantId
            ? { ...it, quantity: clamped }
            : it,
        );
        writeGuestCart(next);
        return next;
      });
      return { ok: true };
    },
    [status],
  );

  const removeLine = useCallback<CartContextValue["removeLine"]>(
    async ({ productId, variantId }) => {
      if (status === "authenticated") {
        const params = new URLSearchParams({ productId });
        if (variantId) params.set("variantId", variantId);
        const res = await fetch(`/api/cart?${params.toString()}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { ok: false, error: body.error || "Couldn't remove item." };
        }
        setItems((prev) =>
          prev.filter(
            (it) => !(it.productId === productId && it.variantId === variantId),
          ),
        );
        return { ok: true };
      }

      setItems((prev) => {
        const next = prev.filter(
          (it) => !(it.productId === productId && it.variantId === variantId),
        );
        writeGuestCart(next);
        return next;
      });
      return { ok: true };
    },
    [status],
  );

  // Reset local cart state after checkout. For auth users the DB cart is already
  // emptied server-side by /api/checkout; this just syncs the in-memory state
  // (and the navbar badge). Guests get their sessionStorage cleared too.
  const clearCart = useCallback<CartContextValue["clearCart"]>(() => {
    setItems([]);
    if (status !== "authenticated") writeGuestCart([]);
  }, [status]);

  const count = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, count, ready, addItem, updateQuantity, removeLine, clearCart }),
    [items, count, ready, addItem, updateQuantity, removeLine, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // Outside a provider (server snapshot, etc.) — return a safe stub.
    return {
      items: [] as CartLine[],
      count: 0,
      ready: false,
      addItem: async () => ({ ok: false, error: "Cart unavailable." }),
      updateQuantity: async () => ({ ok: false, error: "Cart unavailable." }),
      removeLine: async () => ({ ok: false, error: "Cart unavailable." }),
      clearCart: () => {},
    } satisfies CartContextValue;
  }
  return ctx;
}
