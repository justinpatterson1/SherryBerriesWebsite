// Gift-wrap and saved-for-later state lives in localStorage for v1
// (no DB schema change). Both keyed by `productId::variantId|""`.

export type SavedItem = {
  productId: string;
  variantId: string | null;
};

const GIFT_WRAP_KEY = "sb-cart-gift";
const SAVED_KEY = "sb-saved";

export function lineKey(productId: string, variantId: string | null): string {
  return `${productId}::${variantId ?? ""}`;
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private-mode errors
  }
}

export function readGiftWraps(): Record<string, true> {
  return safeRead<Record<string, true>>(GIFT_WRAP_KEY, {});
}

export function writeGiftWraps(map: Record<string, true>) {
  safeWrite(GIFT_WRAP_KEY, map);
}

export function readSaved(): SavedItem[] {
  const raw = safeRead<SavedItem[]>(SAVED_KEY, []);
  return Array.isArray(raw) ? raw : [];
}

export function writeSaved(items: SavedItem[]) {
  safeWrite(SAVED_KEY, items);
}
