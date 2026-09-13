/**
 * The site's light/dark theme, in one place.
 *
 * There were previously two implementations of this: the navbar held the theme
 * in `useState("dark")` and never touched storage, while the admin area
 * persisted to `localStorage["sb-theme"]`. Both wrote `<html data-theme>` and
 * both used the same key, so an admin who chose light in /admin still got dark
 * on the storefront, and the storefront's own toggle was forgotten on every
 * navigation (open-issues #26).
 */

export type Theme = "dark" | "light";

/** Shared with the pre-paint script in components/providers/theme-script.tsx. */
export const THEME_KEY = "sb-theme";

export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

export function otherTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

/**
 * The stored preference, or null when there isn't a usable one.
 *
 * Every access is wrapped: reading `localStorage` *throws* rather than
 * returning null in a browser set to block site data, and in some embedded
 * contexts. A theme preference is never worth breaking the page over.
 */
export function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Persist the preference. Silently does nothing if storage is unavailable. */
export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode, blocked site data, quota — the toggle still works for this
    // page view, it just will not be remembered.
  }
}

/** Write the theme to `<html data-theme>`, which is what the CSS reads. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}
