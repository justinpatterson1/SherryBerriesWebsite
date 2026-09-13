"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  applyTheme,
  isTheme,
  otherTheme,
  storeTheme,
  type Theme,
} from "@/lib/theme";

/** Fired on the window so every mounted toggle stays in step. */
const THEME_EVENT = "sb-theme-change";

/**
 * Subscribe to theme changes.
 *
 * Two sources: this tab's own toggle (the custom event) and another tab's
 * (`storage`, which by design only fires in *other* tabs — which is exactly
 * why the custom event is needed as well).
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * `<html data-theme>` is the source of truth, not a copy of it.
 *
 * ThemeScript writes the stored preference there before the first paint, so by
 * the time React reads this it is already correct — no effect needs to run, and
 * nothing has to be re-synced afterwards.
 */
function getSnapshot(): Theme {
  const current = document.documentElement.dataset.theme;
  return isTheme(current) ? current : DEFAULT_THEME;
}

/** The server cannot know a per-browser preference; the HTML ships the default. */
function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

/**
 * The site theme, persisted across navigations, reloads and tabs.
 *
 * Deliberately `useSyncExternalStore` rather than `useState` + an effect. The
 * theme genuinely lives outside React — in `<html>` and in `localStorage`, both
 * written before React starts — so reading it as external state is both the
 * honest model and the one that avoids a hydration mismatch: React renders the
 * server snapshot first, then switches to the real value in the same commit,
 * with no flash and no setState-in-an-effect.
 *
 * Two toggles can be mounted at once: the root layout renders `SiteNavbar` on
 * every route including `/admin`, which has a toggle of its own. Both read the
 * same store, so they cannot disagree.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    storeTheme(next);
    // Tells every subscriber in this tab to re-read the DOM.
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(otherTheme(getSnapshot()));
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
