import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  anonymizedUserFields,
  checkDeletionAllowed,
  scrubOrderNotes,
  scrubbedOrderShipping,
} from "@/lib/account/delete-account";
import {
  accountDeleteLimiter,
  checkRateLimit,
  tooManyRequests,
} from "@/lib/rate-limit";

/**
 * Self-service account deletion.
 *
 * The account is **anonymized, not row-deleted**: `Order.userId` is a required
 * relation with no `onDelete`, so Postgres RESTRICTs a real delete for anyone
 * who has ever ordered. See lib/account/delete-account.ts for the data rules
 * and the reasoning.
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Keyed by user, not IP: the thing being protected is one account against
  // repeated re-auth attempts, and two people behind one NAT are not related.
  const rl = await checkRateLimit(accountDeleteLimiter, session.user.id);
  if (!rl.success) return tooManyRequests(rl.reset);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { password, confirmEmail } = (body ?? {}) as Record<string, unknown>;

  // Read the user fresh rather than trusting the JWT. The token carries a
  // 20-minute lifetime and a known staleness bug on email changes
  // (open-issues #19), and this is the one operation that cannot be undone.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, password: true, role: true, deletedAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (user.deletedAt) {
    return NextResponse.json({ error: "This account is already deleted." }, { status: 409 });
  }

  // Re-authenticate. Possession of a session is not enough to destroy an
  // account — an unattended logged-in browser should not be able to do this.
  if (user.password) {
    if (typeof password !== "string" || !password) {
      return NextResponse.json(
        { error: "Enter your password to confirm." },
        { status: 400 },
      );
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "That password is incorrect." }, { status: 400 });
    }
  } else {
    // OAuth-only account: there is no password to check, so the confirmation is
    // typing the account's own email address.
    if (
      typeof confirmEmail !== "string" ||
      confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Type your account email address to confirm." },
        { status: 400 },
      );
    }
  }

  const otherSuperadmins = await prisma.user.count({
    where: { role: "SUPERADMIN", deletedAt: null, id: { not: user.id } },
  });
  const gate = checkDeletionAllowed(user.role, otherSuperadmins);
  if (gate.blocked) {
    return NextResponse.json({ error: gate.reason }, { status: 409 });
  }

  // Everything below is one transaction: a half-anonymized account — PII gone
  // from the user row but still present on the orders, or vice versa — is worse
  // than either outcome, and there is no way for the customer to retry it.
  //
  // The orders are listed *inside* the transaction rather than before it. Read
  // outside, an order created in the gap between the read and the write would
  // never be scrubbed and would keep its customer's details forever.
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Sessions and OAuth links first, so the credentials are gone even if a
    // later statement fails and rolls the rest back into place.
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.account.deleteMany({ where: { userId: user.id } });
    await tx.address.deleteMany({ where: { userId: user.id } });
    await tx.wishlist.deleteMany({ where: { userId: user.id } });
    await tx.review.deleteMany({ where: { userId: user.id } });
    await tx.cart.deleteMany({ where: { userId: user.id } });

    // Retained orders, scrubbed. Both copies of the shipping details: the
    // `ship*` columns and the JSON blob in `notes` that checkout also writes.
    const orders = await tx.order.findMany({
      where: { userId: user.id },
      select: { id: true, notes: true },
    });
    for (const order of orders) {
      await tx.order.update({
        where: { id: order.id },
        data: { ...scrubbedOrderShipping(), notes: scrubOrderNotes(order.notes) },
      });
    }

    await tx.user.update({
      where: { id: user.id },
      data: anonymizedUserFields(user.id, now),
    });
  });

  return NextResponse.json({ ok: true });
}
