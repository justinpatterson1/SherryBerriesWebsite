"use client";

import { useEffect, useState } from "react";
import type { PublicPopup } from "@/lib/popups/schedule";
import { PopupDialog } from "./popup-dialog";
import { PopupCard } from "./popup-card";

/**
 * The thank-you screen's popup. The order is already placed, so it never gets
 * in the way of a sale; the server has already skipped buyers who are on the
 * list, so no seen-tracking is needed here.
 */
export function CheckoutPopup({ popup, email }: { popup: PublicPopup; email: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setOpen(true), popup.delaySeconds * 1000);
    return () => clearTimeout(id);
  }, [popup.delaySeconds]);

  if (!open) return null;

  const close = () => setOpen(false);
  return (
    <PopupDialog label={popup.headline} onClose={close}>
      <PopupCard
        popup={popup}
        source="checkout"
        defaultEmail={email}
        onClose={close}
        onCountdownEnd={close}
      />
    </PopupDialog>
  );
}
