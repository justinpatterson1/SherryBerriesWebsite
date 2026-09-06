import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  AUDIT_ACTIONS,
  auditIp,
  maybePurgeAuditLogs,
  writeAuditLog,
} from "@/lib/admin/audit";
import { maskEmail, validateNewsletterEmail } from "@/lib/newsletter/validate";
import { prisma } from "@/lib/db";

// The newsletter list an admin can view, add to, unsubscribe and delete.
//
// Two ways to take an address off the list, and they mean different things:
//   PATCH { subscribed: false } — sets unsubscribedAt. Mail stops, the row and
//     its consent history stay. This is what the public unsubscribe link does,
//     and what should happen when a real person asks to be removed.
//   DELETE — drops the row entirely. For typos and junk signups, where there is
//     no consent history worth keeping.
//
// Addresses are normalised through the same validator the public signup uses,
// so an admin cannot create a duplicate that differs only in case, and the
// unsubscribe token is generated the same way — an admin-added subscriber gets
// a working unsubscribe link like everyone else.
//
// Audit entries record a MASKED address (s***@example.com). The log holds no
// customer personal data by design, but an entry naming only a row id is
// unreadable once that row is deleted.

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Shape the client keeps in state — mirrors AdminSubscriber. */
const SELECT = {
  id: true,
  email: true,
  source: true,
  subscribedAt: true,
  unsubscribedAt: true,
} as const;

type Row = {
  id: string;
  email: string;
  source: string | null;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
};

function serialize(row: Row) {
  return {
    id: row.id,
    email: row.email,
    source: row.source,
    subscribedAt: row.subscribedAt.toISOString(),
    unsubscribedAt: row.unsubscribedAt ? row.unsubscribedAt.toISOString() : null,
  };
}

async function readBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// --- Add ---------------------------------------------------------------------

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const body = await readBody(request);
  if (body === null) return bad("Invalid JSON body.");

  const parsed = validateNewsletterEmail((body as { email?: unknown })?.email);
  if (!parsed.ok) return bad(parsed.error);

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: parsed.email },
    select: SELECT,
  });

  // Already on the list and still subscribed — say so rather than silently
  // doing nothing, since an admin typing an address deserves a real answer.
  // (The public route stays deliberately vague; this one has an admin behind
  // it, so there is no address-enumeration concern.)
  if (existing && !existing.unsubscribedAt) {
    return bad(`${parsed.email} is already subscribed.`, 409);
  }

  const row = await prisma.$transaction(async (tx) => {
    // A previously unsubscribed address is resubscribed in place, so its
    // original subscribedAt and unsubscribe token survive.
    const saved = existing
      ? await tx.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { unsubscribedAt: null },
          select: SELECT,
        })
      : await tx.newsletterSubscriber.create({
          data: {
            email: parsed.email,
            source: "admin",
            unsubscribeToken: randomBytes(24).toString("hex"),
          },
          select: SELECT,
        });

    await writeAuditLog(tx, {
      actor: admin,
      action: existing ? AUDIT_ACTIONS.subscriberUpdate : AUDIT_ACTIONS.subscriberCreate,
      entityType: "NewsletterSubscriber",
      entityId: saved.id,
      summary: existing
        ? `Resubscribed ${maskEmail(saved.email)}`
        : `Added ${maskEmail(saved.email)} to the newsletter list`,
      ip: auditIp(request),
    });

    return saved;
  });
  maybePurgeAuditLogs();

  return NextResponse.json({ ok: true, subscriber: serialize(row) });
}

// --- Subscribe / unsubscribe -------------------------------------------------

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const body = await readBody(request);
  if (body === null) return bad("Invalid JSON body.");

  const id = typeof (body as { id?: unknown })?.id === "string" ? (body as { id: string }).id : "";
  if (!id) return bad("Subscriber id is required.");

  const subscribed = (body as { subscribed?: unknown })?.subscribed;
  if (typeof subscribed !== "boolean") return bad("subscribed must be true or false.");

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { id },
    select: SELECT,
  });
  if (!existing) return bad("Subscriber not found.", 404);

  const wasSubscribed = existing.unsubscribedAt === null;
  if (wasSubscribed === subscribed) {
    // Nothing to do. Return the row so the client stays in sync, and write no
    // audit entry — a no-op is not a change.
    return NextResponse.json({ ok: true, subscriber: serialize(existing) });
  }

  const row = await prisma.$transaction(async (tx) => {
    const saved = await tx.newsletterSubscriber.update({
      where: { id },
      data: { unsubscribedAt: subscribed ? null : new Date() },
      select: SELECT,
    });

    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.subscriberUpdate,
      entityType: "NewsletterSubscriber",
      entityId: id,
      summary: `${subscribed ? "Resubscribed" : "Unsubscribed"} ${maskEmail(saved.email)}`,
      changes: {
        unsubscribedAt: {
          from: existing.unsubscribedAt ? existing.unsubscribedAt.toISOString() : null,
          to: saved.unsubscribedAt ? saved.unsubscribedAt.toISOString() : null,
        },
      },
      ip: auditIp(request),
    });

    return saved;
  });
  maybePurgeAuditLogs();

  return NextResponse.json({ ok: true, subscriber: serialize(row) });
}

// --- Delete ------------------------------------------------------------------

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return bad("Subscriber id is required.");

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { id },
    select: SELECT,
  });
  if (!existing) return bad("Subscriber not found.", 404);

  await prisma.$transaction(async (tx) => {
    await tx.newsletterSubscriber.delete({ where: { id } });
    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.subscriberDelete,
      entityType: "NewsletterSubscriber",
      entityId: id,
      // Nothing is left to look at afterwards, so the masked address is the
      // only thing that makes this entry mean anything later.
      summary: `Deleted ${maskEmail(existing.email)} from the newsletter list`,
      changes: { email: { from: maskEmail(existing.email), to: null } },
      ip: auditIp(request),
    });
  });
  maybePurgeAuditLogs();

  return NextResponse.json({ ok: true, id });
}
