import { DEFAULT_THEME, THEME_KEY } from "@/lib/theme";

/**
 * Applies the stored theme before the browser paints.
 *
 * This has to be a blocking inline script, not an effect. The server cannot
 * know what a given visitor chose — `localStorage` is per-browser — so the HTML
 * always ships with the default. Restoring the preference in React's first
 * effect means the page has already painted dark once, producing a white-to-
 * dark (or dark-to-white) flash on every single navigation for anyone whose
 * choice differs from the default.
 *
 * Running here, before `<body>`, the attribute is already correct when the
 * first paint happens and when React hydrates — so there is nothing to flash
 * and no hydration mismatch on the attribute itself.
 *
 * `<html>` carries `suppressHydrationWarning` because this script mutates an
 * attribute React rendered; without it React logs a mismatch it should ignore.
 *
 * Kept deliberately tiny and dependency-free: it is parsed and executed on
 * every page load, ahead of everything else.
 */
export function ThemeScript() {
  const script = `
try {
  var t = localStorage.getItem(${JSON.stringify(THEME_KEY)});
  document.documentElement.dataset.theme =
    t === "light" || t === "dark" ? t : ${JSON.stringify(DEFAULT_THEME)};
} catch (e) {
  // Storage blocked — the default already on <html> stands.
}`.trim();

  // The content is built from our own constants, never from user input.
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
