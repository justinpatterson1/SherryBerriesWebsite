import { NextResponse } from "next/server";
import { consumePasswordResetToken } from "@/lib/auth/password-reset";
import {
  authLimiters,
  checkRateLimit,
  getClientIp,
  tooManyRequests,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rl = await checkRateLimit(authLimiters.resetPassword, getClientIp(request));
  if (!rl.success) return tooManyRequests(rl.reset);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { token, password, confirmPassword } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
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

  const result = await consumePasswordResetToken(token, password);
  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "This reset link has expired. Request a new one."
        : "This reset link isn't valid. Request a new one.";
    return NextResponse.json({ error: message, reason: result.reason }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
