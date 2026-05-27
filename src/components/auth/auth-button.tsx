"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const pillClass =
  "inline-flex items-center py-2.5 px-4 rounded-full border " +
  "font-sans text-xs font-semibold tracking-[0.12em] uppercase no-underline cursor-pointer " +
  "transition-[background-color,color,border-color,transform] duration-200 " +
  "border-white/12 bg-transparent text-ink-dim " +
  "hover:border-blush hover:text-ink hover:-translate-y-px " +
  "light:border-[rgba(26,13,18,0.12)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0";

export function AuthButton() {
  const { status } = useSession();

  if (status === "loading") {
    // Reserve roughly the same width so the navbar doesn't jump on hydration.
    return (
      <span
        aria-hidden="true"
        className="inline-block w-[88px] h-9 rounded-full bg-white/[0.04] light:bg-[rgba(26,13,18,0.04)]"
      />
    );
  }

  if (status === "authenticated") {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className={pillClass}
      >
        Sign out
      </button>
    );
  }

  return (
    <Link href="/login" className={pillClass}>
      Sign in
    </Link>
  );
}
