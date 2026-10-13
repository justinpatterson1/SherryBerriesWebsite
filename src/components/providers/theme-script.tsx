"use client";

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

  // `text/javascript` on the server, `text/plain` on the client, which is what
  // Next's "preventing flash before hydration" guide prescribes. React warns
  // whenever a render produces a <script>, because a script inserted by a DOM
  // update never executes — true, but irrelevant here: this one has already run
  // during HTML parsing, long before React reaches it. Rendering it inert on
  // the client silences a warning about a problem we do not have, and costs
  // nothing, since re-running it would be a no-op anyway.
  //
  // This is why the component is a Client Component: the type has to be decided
  // on each side, and a server-only component is evaluated once, on the server.
  //
  // `suppressHydrationWarning` covers the type differing between the two.
  //
  // The content is built from our own constants, never from user input.
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
