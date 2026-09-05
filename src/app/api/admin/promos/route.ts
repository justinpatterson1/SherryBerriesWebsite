import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  AUDIT_ACTIONS,
  auditIp,
  diffFields,
  hasChanges,
  maybePurgeAuditLogs,
  writeAuditLog,
} from "@/lib/admin/audit";
import { promoLabel, validatePromo } from "@/lib/admin/promo-validate";
import { prisma } from "@/lib/db";

// Promo codes an admin can create, edit and retire. The checkout looks codes up
// by their uppercased form and applies percentageOff OR amountOff — never both
// — which is why validatePromo refuses a code carrying two values.
//
// Every write is audited in the same transaction as the change: a discount is
// money, so "who created this code, and who bumped it to 50%?" has to be
// answerable.

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Shape the client keeps in state — mirrors AdminPromo. */
const SELECT = {
  id: true,
  code: true,
  percentageOff: true,
  amountOff: true,
  active: true,
  usageLimit: true,
  timesUsed: true,
  expiresAt: true,
} as const;

async function readBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Stored at end of day so a code advertised "until the 30th" works all of the 30th. */
function toExpiry(date: string): Date | null {
  if (!date) return null;
  const when = new Date(date);
  when.setHours(23, 59, 59, 999);
  return when;
}

// --- Create ------------------------------------------------------------------

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const body = await readBody(request);
  if (body === null) return bad("Invalid JSON body.");

  const parsed = validatePromo((body ?? {}) as Record<string, unknown>);
  if (!parsed.ok) return bad(parsed.error);
  const d = parsed.data;

  const clash = await prisma.discountCode.findUnique({
    where: { code: d.code },
    select: { id: true },
  });
  if (clash) return bad(`“${d.code}” already exists.`, 409);

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.discountCode.create({
      data: {
        code: d.code,
        percentageOff: d.percentageOff,
        amountOff: d.amountOff,
        usageLimit: d.usageLimit,
        expiresAt: toExpiry(d.expiresAt),
        active: d.active,
      },
      select: SELECT,
    });

    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.promoCreate,
      entityType: "DiscountCode",
      entityId: row.id,
      summary: `Created ${row.code} — ${promoLabel(d.percentageOff, d.amountOff)}${
        d.usageLimit ? `, limit ${d.usageLimit}` : ""
      }`,
      ip: auditIp(request),
    });

    return row;
  });
  maybePurgeAuditLogs();

  return NextResponse.json({ ok: true, promo: serialize(created) });
}

// --- Update ------------------------------------------------------------------

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const body = await readBody(request);
  if (body === null) return bad("Invalid JSON body.");

  const id = typeof (body as { id?: unknown })?.id === "string" ? (body as { id: string }).id : "";
  if (!id) return bad("Promo id is required.");

  const parsed = validatePromo((body ?? {}) as Record<string, unknown>);
  if (!parsed.ok) return bad(parsed.error);
  const d = parsed.data;

  const existing = await prisma.discountCode.findUnique({ where: { id }, select: SELECT });
  if (!existing) return bad("Promo code not found.", 404);

  const clash = await prisma.discountCode.findUnique({
    where: { code: d.code },
    select: { id: true },
  });
  if (clash && clash.id !== id) return bad(`“${d.code}” already exists.`, 409);

  // timesUsed is never touched here — it belongs to the checkout, and editing a
  // code must not quietly reset how many times it has been redeemed.
  const data = {
    code: d.code,
    percentageOff: d.percentageOff,
    amountOff: d.amountOff,
    usageLimit: d.usageLimit,
    expiresAt: toExpiry(d.expiresAt),
    active: d.active,
  };

  const changes = diffFields(existing, data, [
    "code",
    "percentageOff",
    "amountOff",
    "usageLimit",
    "expiresAt",
    "active",
  ]);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.discountCode.update({ where: { id }, data, select: SELECT });
    if (hasChanges(changes)) {
      await writeAuditLog(tx, {
        actor: admin,
        action: AUDIT_ACTIONS.promoUpdate,
        entityType: "DiscountCode",
        entityId: id,
        // Changing what a code is worth is the edit worth spotting at a glance.
        summary:
          changes.percentageOff || changes.amountOff
            ? `${row.code}: now ${promoLabel(d.percentageOff, d.amountOff)}`
            : `${row.code}: updated ${Object.keys(changes).join(", ")}`,
        changes,
        ip: auditIp(request),
      });
    }
    return row;
  });
  maybePurgeAuditLogs();

  return NextResponse.json({ ok: true, promo: serialize(updated) });
}

// --- Delete ------------------------------------------------------------------

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return bad("Promo id is required.");

  const existing = await prisma.discountCode.findUnique({ where: { id }, select: SELECT });
  if (!existing) return bad("Promo code not found.", 404);

  // A code that has been redeemed is part of what happened to real orders.
  // Deleting it would erase that, so a used code is retired by switching it off
  // instead — which stops it working immediately and keeps the history.
  if (existing.timesUsed > 0) {
    return bad(
      `“${existing.code}” has been used ${existing.timesUsed} time${
        existing.timesUsed === 1 ? "" : "s"
      }. Switch it off instead of deleting it, so the record of those orders is kept.`,
      409,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.discountCode.delete({ where: { id } });
    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.promoDelete,
      entityType: "DiscountCode",
      entityId: id,
      // Nothing is left to look at afterwards, so the code itself is recorded.
      summary: `Deleted ${existing.code} (never used)`,
      changes: { code: { from: existing.code, to: null } },
      ip: auditIp(request),
    });
  });
  maybePurgeAuditLogs();

  return NextResponse.json({ ok: true, id });
}

function serialize(row: {
  id: string;
  code: string;
  percentageOff: number | null;
  amountOff: unknown;
  active: boolean;
  usageLimit: number | null;
  timesUsed: number;
  expiresAt: Date | null;
}) {
  return {
    id: row.id,
    code: row.code,
    percentageOff: row.percentageOff,
    amountOff: row.amountOff == null ? null : Number(row.amountOff),
    active: row.active,
    usageLimit: row.usageLimit,
    timesUsed: row.timesUsed,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  };
}
