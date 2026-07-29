import { NextResponse } from "next/server";
import {
  checkRateLimit,
  contactLimiter,
  getClientIp,
  tooManyRequests,
} from "@/lib/rate-limit";
import { validateContact } from "@/lib/contact/validate";
import { sendContactEmail } from "@/lib/email/resend";

// Where contact messages are delivered: CONTACT_EMAIL, else the address inside
// EMAIL_FROM ("Name <addr@x>" or "addr@x"). Null when neither is usable.
function resolveDestination(): string | null {
  const explicit = process.env.CONTACT_EMAIL?.trim();
  if (explicit) return explicit;
  const from = process.env.EMAIL_FROM ?? "";
  const addr = (from.match(/<([^>]+)>/)?.[1] ?? from).trim();
  return addr || null;
}

export async function POST(request: Request) {
  const rl = await checkRateLimit(contactLimiter, getClientIp(request));
  if (!rl.success) return tooManyRequests(rl.reset);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = validateContact((body ?? {}) as Record<string, unknown>);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const to = resolveDestination();
  if (!to) {
    console.error("[contact] No destination configured — set CONTACT_EMAIL in .env.");
    return NextResponse.json(
      { error: "Contact isn't set up right now. Please try again later." },
      { status: 503 },
    );
  }

  const result = await sendContactEmail({ to, ...parsed.data });
  if (!result.ok) {
    // Don't lose the message if the mail provider is down — log it in dev.
    console.error("[contact] send failed:", result.error, "\nPayload:", parsed.data);
    return NextResponse.json(
      { error: "We couldn't send your message. Please try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
