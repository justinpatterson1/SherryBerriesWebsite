import "server-only";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Password-reset tokens share the VerificationToken table but live under a
// namespaced identifier so minting/clearing one flow never touches the other.
const PREFIX = "reset:";
const identifierFor = (email: string) => `${PREFIX}${email}`;

/**
 * Mint a fresh password-reset token for an email, clearing any prior reset
 * tokens for that address so only the latest link is valid.
 */
export async function createPasswordResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier: identifierFor(email) },
  });
  await prisma.verificationToken.create({
    data: { identifier: identifierFor(email), token, expires },
  });
  return token;
}

type TokenRow = { identifier: string; expires: Date };

function readEmail(row: TokenRow | null): string | null {
  if (!row || !row.identifier.startsWith(PREFIX)) return null;
  if (row.expires.getTime() < Date.now()) return null;
  return row.identifier.slice(PREFIX.length);
}

/**
 * Check a token without consuming it — used to decide whether to render the
 * reset form. Returns the target email when the token is valid and unexpired.
 */
export async function findValidResetToken(token: string): Promise<string | null> {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  return readEmail(row);
}

export type ResetResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Validate the token, set the user's new (hashed) password, and delete the
 * token (single-use). An expired token is cleared on the way out.
 */
export async function consumePasswordResetToken(
  token: string,
  newPassword: string,
): Promise<ResetResult> {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row || !row.identifier.startsWith(PREFIX)) {
    return { ok: false, reason: "invalid" };
  }

  if (row.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { ok: false, reason: "expired" };
  }

  const email = row.identifier.slice(PREFIX.length);
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: passwordHash },
  });
  await prisma.verificationToken.delete({ where: { token } });

  return { ok: true, email };
}
