import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

// One-click unsubscribe. Reached from the link in a newsletter, so it must work
// with no account and no session — the token in the URL is the whole proof.
//
// The row is not deleted: unsubscribedAt is stamped instead, so the same link
// stays valid, a repeat visit is idempotent, and there is a record of when
// consent was withdrawn.

export const metadata: Metadata = {
  title: "Unsubscribe · SherryBerries",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ token?: string }> };

async function unsubscribe(token: string): Promise<"done" | "unknown"> {
  const row = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
    select: { id: true, unsubscribedAt: true },
  });
  if (!row) return "unknown";
  if (!row.unsubscribedAt) {
    await prisma.newsletterSubscriber.update({
      where: { id: row.id },
      data: { unsubscribedAt: new Date() },
    });
  }
  return "done";
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const result = token ? await unsubscribe(token) : "unknown";

  return (
    <main className="pt-[140px] pb-[120px] px-[8%] max-[900px]:px-[6%] max-[900px]:pt-[110px]">
      <div className="mx-auto max-w-[560px] text-center">
        <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-pink">
          Newsletter
        </span>
        <h1 className="font-display text-[clamp(34px,4.4vw,52px)] leading-[1.06] text-ink m-0 mt-3">
          {result === "done" ? (
            <>
              You&apos;re <span className="font-serif italic text-blush">unsubscribed</span>.
            </>
          ) : (
            <>That link didn&apos;t work.</>
          )}
        </h1>
        <p className="font-sans text-[15px] leading-[1.65] text-ink-dim mt-4">
          {result === "done"
            ? "You won't get any more newsletters from us. Your orders and account emails are separate — those keep coming, because you need them."
            : "The link may be incomplete, or the address may already have been removed. If you're still getting newsletters, contact us and we'll take care of it."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] py-3 px-6 rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[12px] font-bold tracking-[0.12em] uppercase no-underline transition-transform duration-200 hover:-translate-y-px"
          >
            Back to the shop
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center min-h-[44px] py-3 px-6 rounded-full border border-white/14 bg-transparent text-ink-dim font-sans text-[12px] font-bold tracking-[0.12em] uppercase no-underline transition-colors hover:text-ink hover:border-blush light:border-[rgba(26,13,18,0.14)]"
          >
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
