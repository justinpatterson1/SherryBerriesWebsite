import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/auth/verification";
import { sendVerificationEmail } from "@/lib/email/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, password, confirmPassword } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const trimmedName = name.trim();
  const [firstName, ...rest] = trimmedName.split(/\s+/);
  const lastName = rest.length > 0 ? rest.join(" ") : null;
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: trimmedName,
      firstName,
      lastName,
      password: passwordHash,
      role: "CUSTOMER",
      // emailVerified intentionally left null — set once the link is clicked.
    },
    select: { id: true, email: true, name: true },
  });

  const token = await createVerificationToken(normalizedEmail);
  const verifyUrl = `${new URL(request.url).origin}/verify-email?token=${token}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[verify-email] ${normalizedEmail} → ${verifyUrl}`);
  }

  const sent = await sendVerificationEmail({
    to: normalizedEmail,
    name: trimmedName,
    verifyUrl,
  });
  if (!sent.ok) {
    // Keep the (unverified) user so they can request a resend; surface a soft
    // warning rather than failing the whole registration.
    console.error(`[verify-email] send failed for ${normalizedEmail}: ${sent.error}`);
  }

  return NextResponse.json(
    {
      ok: true,
      requiresVerification: true,
      emailSent: sent.ok,
      user,
    },
    { status: 201 },
  );
}
