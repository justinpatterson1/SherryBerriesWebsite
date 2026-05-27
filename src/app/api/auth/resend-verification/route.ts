import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/auth/verification";
import { sendVerificationEmail } from "@/lib/email/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generic response used for unknown / already-verified emails so we don't leak
// which addresses have accounts.
const GENERIC = {
  ok: true,
  message: "If that email needs verifying, we've sent a fresh link.",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (body as { email?: unknown })?.email;
  if (typeof raw !== "string" || !EMAIL_RE.test(raw)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  const email = raw.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, emailVerified: true },
  });

  // Only send for real, still-unverified accounts — but always reply generically.
  if (user && !user.emailVerified) {
    const token = await createVerificationToken(email);
    const verifyUrl = `${new URL(request.url).origin}/verify-email?token=${token}`;
    if (process.env.NODE_ENV !== "production") {
      console.log(`[verify-email/resend] ${email} → ${verifyUrl}`);
    }
    await sendVerificationEmail({ to: email, name: user.name, verifyUrl });
  }

  return NextResponse.json(GENERIC);
}
