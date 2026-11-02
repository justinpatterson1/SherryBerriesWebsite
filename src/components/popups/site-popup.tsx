"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isLive, pickPopup, type PublicPopup, type SeenMap } from "@/lib/popups/schedule";
import { PopupDialog } from "./popup-dialog";
import { PopupCard } from "./popup-card";

// Popup id → when this browser last showed it. ONCE and DAILY popups are
// remembered in localStorage, SESSION ones in sessionStorage.
const SEEN_KEY = "sb-popups";

function readSeen(storage: () => Storage): SeenMap {
  try {
    const parsed = JSON.parse(storage().getItem(SEEN_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as SeenMap) : {};
  } catch {
    return {};
  }
}

function markSeen(popup: PublicPopup): void {
  const storage = () => (popup.frequency === "SESSION" ? sessionStorage : localStorage);
  try {
    const seen = readSeen(storage);
    seen[popup.id] = Date.now();
    storage().setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // Storage blocked (private mode, disabled cookies): the popup may show
    // again next visit, which beats not showing the site at all.
  }
}

// Checkout has its own popup on the thank-you screen and must not be
// interrupted mid-payment; admin is not the shop.
function isExcluded(pathname: string | null): boolean {
  return !pathname || pathname.startsWith("/admin") || pathname.startsWith("/checkout");
}

/** The one site-wide popup a visitor sees, if any. Mounted in the root layout. */
export function SitePopup() {
  const pathname = usePathname();
  const excluded = isExcluded(pathname);
  const [popup, setPopup] = useState<PublicPopup | null>(null);

  useEffect(() => {
    if (excluded) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    fetch("/api/popups")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { popups?: PublicPopup[] } | null) => {
        if (cancelled || !json?.popups?.length) return;
        const pick = pickPopup(json.popups, Date.now(), {
          local: readSeen(() => localStorage),
          session: readSeen(() => sessionStorage),
        });
        if (!pick) return;
        timer = setTimeout(() => {
          // The response may be up to a few minutes old; the end date is
          // checked again here so an offer that just closed is not shown.
          if (!isLive(pick, Date.now())) return;
          markSeen(pick);
          setPopup(pick);
        }, pick.delaySeconds * 1000);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Once per page load: the layout persists across client navigation, so this
    // does not re-run on every link — only when leaving an excluded route.
  }, [excluded]);

  if (!popup || excluded) return null;

  const close = () => setPopup(null);
  return (
    <PopupDialog label={popup.headline} onClose={close}>
      <PopupCard popup={popup} source="popup" onClose={close} onCountdownEnd={close} />
    </PopupDialog>
  );
}
