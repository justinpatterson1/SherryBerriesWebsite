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
  perUserLimit: true,
  timesUsed: true,
  expiresAt: true,
  excludedCategories: { select: { id: true } },
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

/**
 * Category exclusions as one comparable string, for the audit diff.
 *
 * diffFields compares with Object.is, which reports two arrays of identical ids
 * as a change every time. Sorting and joining makes the set order-insensitive
 * and comparable, and reads better in the log than a raw array would.
 */
function exclusionKey(ids: string[]): string {
  return [...ids].sort().join(",");
}

/** Refuses ids that are not real categories, so a stale form cannot save junk. */
async function validCategoryIds(ids: string[]): Promise<string[] | null> {
  if (ids.length === 0) return [];
  const rows = await prisma.category.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  return rows.length === ids.length ? ids : null;
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

  const excluded = await validCategoryIds(d.excludedCategoryIds);
  if (!excluded) return bad("One of those categories no longer exists. Reload and try again.");

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.discountCode.create({
      data: {
        code: d.code,
        percentageOff: d.percentageOff,
        amountOff: d.amountOff,
        usageLimit: d.usageLimit,
        perUserLimit: d.perUserLimit,
        expiresAt: toExpiry(d.expiresAt),
        active: d.active,
        excludedCategories: { connect: excluded.map((id) => ({ id })) },
      },
      select: SELECT,
    });

    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.promoCreate,
      entityType: "DiscountCode",
      entityId: row.id,
      summary: `Created ${row.code}: ${promoLabel(d.percentageOff, d.amountOff)}${
        d.usageLimit ? `, limit ${d.usageLimit}` : ""
      }${d.perUserLimit ? `, ${d.perUserLimit} per customer` : ""}${
        excluded.length ? `, ${excluded.length} category excluded` : ""
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

  const excluded = await validCategoryIds(d.excludedCategoryIds);
  if (!excluded) return bad("One of those categories no longer exists. Reload and try again.");

  // timesUsed is never touched here — it belongs to the checkout, and editing a
  // code must not quietly reset how many times it has been redeemed. Neither
  // are the redemption rows: lowering the per-customer limit applies to future
  // orders and cannot un-redeem a past one.
  const data = {
    code: d.code,
    percentageOff: d.percentageOff,
    amountOff: d.amountOff,
    usageLimit: d.usageLimit,
    perUserLimit: d.perUserLimit,
    expiresAt: toExpiry(d.expiresAt),
    active: d.active,
    // `set` rather than `connect`: this is the whole list, so unticking a
    // category has to disconnect it.
    excludedCategories: { set: excluded.map((cid) => ({ id: cid })) },
  };

  const changes = diffFields(
    { ...existing, excludedCategories: exclusionKey(existing.excludedCategories.map((c) => c.id)) },
    { ...data, excludedCategories: exclusionKey(excluded) },
    [
      "code",
      "percentageOff",
      "amountOff",
      "usageLimit",
      "perUserLimit",
      "expiresAt",
      "active",
      "excludedCategories",
    ],
  );

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
  perUserLimit: number | null;
  timesUsed: number;
  expiresAt: Date | null;
  excludedCategories: { id: string }[];
}) {
  return {
    id: row.id,
    code: row.code,
    percentageOff: row.percentageOff,
    amountOff: row.amountOff == null ? null : Number(row.amountOff),
    active: row.active,
    usageLimit: row.usageLimit,
    perUserLimit: row.perUserLimit,
    timesUsed: row.timesUsed,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    excludedCategoryIds: row.excludedCategories.map((c) => c.id),
  };
}
