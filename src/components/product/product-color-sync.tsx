"use client";

import { createContext, useContext, useState } from "react";

/**
 * A colour pick, as the gallery hears it. A fresh object per pick, so picking
 * the same colour again — after browsing other thumbnails — still jumps back.
 */
export type ColorPick = { imageUrl: string };

const ColorSyncContext = createContext<{
  pick: ColorPick | null;
  setPick: (pick: ColorPick) => void;
} | null>(null);

/**
 * Carries the chosen colour's photo from the buy box to the gallery. The two
 * sit apart on the PDP with server-rendered content between them, so this
 * wraps the section rather than lifting either into the other.
 */
export function ProductColorSync({ children }: { children: React.ReactNode }) {
  const [pick, setPick] = useState<ColorPick | null>(null);
  return <ColorSyncContext.Provider value={{ pick, setPick }}>{children}</ColorSyncContext.Provider>;
}

/** Null outside a ProductColorSync, where there is nothing to sync. */
export function useColorSync() {
  return useContext(ColorSyncContext);
}
