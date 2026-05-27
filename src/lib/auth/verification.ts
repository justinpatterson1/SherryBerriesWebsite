import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Mint a fresh verification token for an email, clearing any prior tokens for
 * that address so only the latest link is valid.
 */
export async function createVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });
  return token;
}

export type ConsumeResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Validate a token, and on success mark the matching user verified and delete
 * the token (single-use).
 */
export async function consumeVerificationToken(
  token: string,
): Promise<ConsumeResult> {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row) return { ok: false, reason: "invalid" };

  if (row.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { ok: false, reason: "expired" };
  }

  await prisma.user.update({
    where: { email: row.identifier },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.delete({ where: { token } });

  return { ok: true, email: row.identifier };
}
