import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/auth/password-reset";
import { createVerificationToken } from "@/lib/auth/verification";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generic response used regardless of account state so we don't leak which
// addresses have accounts (or whether they're verified). The email we send
// tells the user what to do next.
const GENERIC = {
  ok: true,
  message: "If an account exists for that email, check your inbox for the next step.",
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
    select: { name: true, password: true, emailVerified: true },
  });
  const origin = new URL(request.url).origin;

  if (user?.password) {
    if (user.emailVerified) {
      // Verified: send the actual reset link.
      const token = await createPasswordResetToken(email);
      const resetUrl = `${origin}/reset-password?token=${token}`;
      if (process.env.NODE_ENV !== "production") {
        console.log(`[reset-password] ${email} → ${resetUrl}`);
      }
      await sendPasswordResetEmail({ to: email, name: user.name, resetUrl });
    } else {
      // Unverified: resetting is gated on the same email-ownership proof as
      // sign-in, so send a verification link instead. Once verified, a fresh
      // reset request will deliver the reset link.
      const token = await createVerificationToken(email);
      const verifyUrl = `${origin}/verify-email?token=${token}`;
      if (process.env.NODE_ENV !== "production") {
        console.log(`[reset-password → verify-first] ${email} → ${verifyUrl}`);
      }
      await sendVerificationEmail({ to: email, name: user.name, verifyUrl });
    }
  }

  return NextResponse.json(GENERIC);
}
