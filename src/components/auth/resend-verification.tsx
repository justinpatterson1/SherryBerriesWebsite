"use client";

import { useState, type FormEvent } from "react";

export function ResendVerification() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === "sending" || !email.trim()) return;
    setState("sending");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // network errors fall through to the generic confirmation below
    }
    setState("sent");
  };

  if (state === "sent") {
    return (
      <p className="font-sans text-[14px] leading-[1.6] text-blush">
        ✦ If that email needs verifying, a fresh link is on its way. Check your
        inbox.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        autoComplete="email"
        className={
          "w-full h-12 px-4 rounded-xl border border-white/12 bg-white/[0.03] " +
          "font-sans text-[15px] text-ink placeholder:text-ink-faint outline-none " +
          "transition-[border-color,background-color] duration-200 " +
          "focus:border-pink focus:bg-pink/[0.04] " +
          "light:bg-white light:border-[rgba(26,13,18,0.12)]"
        }
      />
      <button
        type="submit"
        disabled={state === "sending" || !email.trim()}
        className={
          "h-12 rounded-full border-0 bg-gradient-to-br from-pink to-pink-deep " +
          "text-white font-sans text-[13px] font-bold tracking-[0.16em] uppercase cursor-pointer " +
          "shadow-[0_10px_28px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
          "transition-[transform,opacity] duration-200 hover:-translate-y-px " +
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        }
      >
        {state === "sending" ? "Sending…" : "Send a new link"}
      </button>
    </form>
  );
}
