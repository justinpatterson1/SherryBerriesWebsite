"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const STRENGTH_COPY = [
  "Use 8+ characters with letters, numbers & a symbol.",
  "Getting started — try a longer mix.",
  "Decent — add a number or symbol for extra glow.",
  "Strong — one more touch unlocks elite.",
  "Sparkling secure. Sherry-approved ✦",
];

function scoreStrength(pwd: string): number {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

function strengthBarStyle(strength: number) {
  const widths = ["0%", "25%", "50%", "75%", "100%"];
  const colors = [
    "transparent",
    "#d63a3a",
    "#d6883a",
    "var(--color-gold-soft)",
    "linear-gradient(90deg, var(--color-pink), var(--color-gold-soft))",
  ];
  return { width: widths[strength], background: colors[strength] };
}

const inputClass =
  "w-full h-12 px-4 rounded-xl border border-white/12 bg-white/[0.03] " +
  "font-sans text-[15px] text-ink placeholder:text-ink-faint outline-none " +
  "transition-[border-color,background-color] duration-200 " +
  "focus:border-pink focus:bg-pink/[0.04] " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const strength = scoreStrength(password);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === "saving") return;
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setState("saving");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword: confirm }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setState("idle");
        setError(body.error || "Couldn't reset your password. Try again.");
        return;
      }
      setState("done");
    } catch {
      setState("idle");
      setError("Something went wrong. Please try again.");
    }
  };

  if (state === "done") {
    return (
      <>
        <div
          aria-hidden="true"
          className="mx-auto mt-8 mb-2 inline-flex w-16 h-16 items-center justify-center rounded-full bg-pink/[0.12] text-pink text-[32px]"
        >
          ✓
        </div>
        <h1 className="font-display text-[clamp(30px,3.4vw,40px)] leading-[1.1] text-ink m-0 mb-3">
          Password{" "}
          <em className="font-serif italic text-blush font-medium">reset</em> ✦
        </h1>
        <p className="font-sans text-[15px] leading-[1.6] text-ink-dim mb-7">
          Your password is updated. Sign in with your new password.
        </p>
        <Link
          href="/login"
          className={
            "inline-block py-3.5 px-7 rounded-full bg-gradient-to-br from-pink to-pink-deep " +
            "text-white font-sans text-[13px] font-bold tracking-[0.16em] uppercase no-underline " +
            "shadow-[0_10px_28px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
            "transition-transform duration-200 hover:-translate-y-px"
          }
        >
          Sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-[clamp(28px,3.2vw,38px)] leading-[1.1] text-ink m-0 mb-3">
        Choose a new{" "}
        <em className="font-serif italic text-blush font-medium">password</em>
      </h1>
      <p className="font-sans text-[15px] leading-[1.6] text-ink-dim mb-7">
        Make it strong — 8+ characters with a mix of letters, numbers, and a
        symbol.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-2.5 text-left">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            onClick={() => setShow((v) => !v)}
            className={
              "absolute right-2 top-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full " +
              "border-0 bg-transparent text-ink-faint cursor-pointer inline-flex items-center justify-center " +
              "transition-[color,background-color] duration-200 hover:text-pink hover:bg-pink/[0.08]"
            }
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>

        <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            aria-hidden="true"
            style={strengthBarStyle(strength)}
            className="h-full rounded-full transition-[width,background] duration-[280ms]"
          />
        </div>
        <p
          aria-live="polite"
          className={`font-sans text-xs m-0 ${
            strength >= 3 ? "text-blush" : "text-ink-faint"
          }`}
        >
          {STRENGTH_COPY[strength]}
        </p>

        <input
          type={show ? "text" : "password"}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          className={`${inputClass} mt-1`}
        />

        {error && (
          <p aria-live="polite" className="font-sans text-[13px] text-[#ff8d8d] m-0">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={state === "saving" || !password || !confirm}
          className={
            "mt-1 h-12 rounded-full border-0 bg-gradient-to-br from-pink to-pink-deep " +
            "text-white font-sans text-[13px] font-bold tracking-[0.16em] uppercase cursor-pointer " +
            "shadow-[0_10px_28px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
            "transition-[transform,opacity] duration-200 hover:-translate-y-px " +
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          }
        >
          {state === "saving" ? "Saving…" : "Reset password"}
        </button>
      </form>
    </>
  );
}
