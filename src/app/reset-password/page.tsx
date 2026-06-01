import type { Metadata } from "next";
import Link from "next/link";
import { findValidResetToken } from "@/lib/auth/password-reset";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password | SherryBerries",
  robots: { index: false },
};

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const email = token ? await findValidResetToken(token) : null;
  const valid = Boolean(token && email);

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

          {valid && token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <>
              <div
                aria-hidden="true"
                className="mx-auto mt-8 mb-2 inline-flex w-16 h-16 items-center justify-center rounded-full bg-white/[0.05] text-ink-faint text-[30px]"
              >
                ⏳
              </div>
              <h1 className="font-display text-[clamp(28px,3.2vw,38px)] leading-[1.1] text-ink m-0 mb-3">
                This link isn&apos;t valid
              </h1>
              <p className="font-sans text-[15px] leading-[1.6] text-ink-dim mb-7">
                Password reset links last 1 hour and can only be used once.
                Request a fresh one and we&apos;ll send it right over.
              </p>
              <Link
                href="/forgot-password"
                className={
                  "inline-block py-3.5 px-7 rounded-full bg-gradient-to-br from-pink to-pink-deep " +
                  "text-white font-sans text-[13px] font-bold tracking-[0.16em] uppercase no-underline " +
                  "shadow-[0_10px_28px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
                  "transition-transform duration-200 hover:-translate-y-px"
                }
              >
                Request a new link
              </Link>
              <p className="font-sans text-[13px] text-ink-faint mt-6">
                <Link
                  href="/login"
                  className="text-blush no-underline hover:text-pink transition-colors"
                >
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
