"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

/**
 * Modal shell for storefront popups: scrim, scroll lock, Escape, a Tab trap
 * and focus handed back on close. Same conventions as the search overlay.
 */
export function PopupDialog({
  label,
  onClose,
  children,
}: {
  /** Read out by screen readers when the popup opens. */
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // The panel, not its first button: focusing the close X would draw a ring
    // on it and read "Close" before the popup's own message.
    panelRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="presentation">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default border-0 bg-black/60 backdrop-blur-[4px] animate-[fadeIn_220ms_ease]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative z-[1] w-full max-w-[440px] outline-none motion-safe:animate-[popupIn_320ms_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        {children}
      </div>
    </div>
  );
}
