"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

const IDLE_LIMIT_MS = 20 * 60 * 1000;
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
] as const;

export function IdleSignOut() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    let timer = window.setTimeout(fireSignOut, IDLE_LIMIT_MS);

    function fireSignOut() {
      signOut({ callbackUrl: "/login?reason=idle" });
    }

    function reset() {
      window.clearTimeout(timer);
      timer = window.setTimeout(fireSignOut, IDLE_LIMIT_MS);
    }

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, reset, { passive: true });
    }

    return () => {
      window.clearTimeout(timer);
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, reset);
      }
    };
  }, [status]);

  return null;
}
