import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { checkRateLimit, contactLimiter, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { newsletterSource, validateNewsletterEmail } from "@/lib/newsletter/validate";
import { prisma } from "@/lib/db";
import { popupRewardCode } from "@/lib/queries/popups";

// Newsletter signup. The form used to fake success with a 600 ms timer and
// discard the address entirely (open-issues #24); it now writes to the
// NewsletterSubscriber table, which existed all along but was never used
// outside the seed.

export async function POST(request: Request) {
  // Reuses the contact limiter's budget (5/hour/IP): both are unauthenticated
  // endpoints that send mail somewhere, and neither is worth its own bucket.
  const rl = await checkRateLimit(contactLimiter, getClientIp(request));
  if (!rl.success) return tooManyRequests(rl.reset);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const b = (body ?? {}) as { email?: unknown; source?: unknown; popupId?: unknown };
  const parsed = validateNewsletterEmail(b.email);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    // Upsert rather than create: signing up again with an address that had
    // unsubscribed is a deliberate re-subscribe, and clearing unsubscribedAt is
    // the whole point. An address already subscribed is a no-op.
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.email },
      update: { unsubscribedAt: null },
      create: {
        email: parsed.email,
        // Only set on create: a returning address keeps the source it first
        // signed up from.
        source: newsletterSource(b.source),
        unsubscribeToken: randomBytes(24).toString("hex"),
      },
    });
  } catch (error) {
    console.error("[newsletter] Could not record the signup:", error);
    return NextResponse.json(
      { error: "We couldn't sign you up just now. Please try again." },
      { status: 503 },
    );
  }

  // A popup's reward code, revealed only now the signup has gone through. A
  // failed lookup costs the code, not the signup that already succeeded.
  const promoCode =
    typeof b.popupId === "string" && b.popupId
      ? await popupRewardCode(b.popupId).catch(() => null)
      : null;

  // Deliberately identical whether the address was new, already on the list, or
  // returning: a differing reply would let anyone test whether an address is
  // subscribed. Same reasoning as the forgot-password route.
  return NextResponse.json(promoCode ? { ok: true, promoCode } : { ok: true });
}
