import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password | SherryBerries",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24 bg-canvas">
      <div
        className={
          "relative w-full max-w-[460px] p-10 rounded-[24px] text-center overflow-hidden " +
          "bg-card border border-white/[0.06] " +
          "before:content-[''] before:absolute before:inset-0 before:pointer-events-none " +
          "before:bg-[radial-gradient(circle_at_50%_15%,rgba(255,79,163,0.16),transparent_60%)]"
        }
      >
        <div className="relative">
          <Link
            href="/"
            className="font-display text-[28px] tracking-[0.02em] text-ink no-underline leading-none"
          >
            Sherry<span className="font-serif italic text-pink ml-px">Berries</span>
          </Link>

          <div
            aria-hidden="true"
            className="mx-auto mt-8 mb-2 inline-flex w-16 h-16 items-center justify-center rounded-full bg-pink/[0.12] text-pink text-[30px]"
          >
            ✦
          </div>
          <h1 className="font-display text-[clamp(28px,3.2vw,38px)] leading-[1.1] text-ink m-0 mb-3">
            Forgot your{" "}
            <em className="font-serif italic text-blush font-medium">password</em>?
          </h1>
          <p className="font-sans text-[15px] leading-[1.6] text-ink-dim mb-7">
            Enter your email and we&apos;ll send you a link to choose a new one.
          </p>

          <ForgotPasswordForm />

          <p className="font-sans text-[13px] text-ink-faint mt-6">
            <Link
              href="/login"
              className="text-blush no-underline hover:text-pink transition-colors"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
