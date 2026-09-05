import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { AdminUser } from "@/lib/admin/guard";
import {
  AUDIT_RETENTION_MONTHS,
  hasChanges,
  type AuditAction,
  type ChangeSet,
} from "@/lib/admin/audit-changes";

// Database half of the admin audit log. Every write below happens inside the
// same transaction as the change it describes (the owner chose the strict
// version), so a change cannot land without a log row — if the log write fails,
// the change rolls back with it.
//
// The log holds NO customer personal data. Order and return entries record the
// order number or return reference and the transition; the customer's details
// already live on that record and are not copied here.
//
// The pure helpers live in ./audit-changes and are re-exported so routes have a
// single import.
export * from "@/lib/admin/audit-changes";

export type AuditEntry = {
  actor: AdminUser;
  action: AuditAction;
  entityType: string;
  entityId: string;
  summary: string;
  changes?: ChangeSet;
  ip?: string | null;
};

/**
 * Write one log row. Pass the transaction client so the row and the change it
 * describes commit or fail together.
 */
export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  entry: AuditEntry,
): Promise<void> {
  await tx.adminAuditLog.create({
    data: {
      actorId: entry.actor.id,
      actorEmail: entry.actor.email,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      summary: entry.summary,
      changes:
        entry.changes && hasChanges(entry.changes)
          ? (entry.changes as Prisma.InputJsonValue)
          : undefined,
      ip: entry.ip ?? null,
    },
  });
}

/**
 * Delete rows past the retention window.
 *
 * Called opportunistically after a log write rather than on a schedule, since
 * the project has no cron: a small fraction of writes trigger a sweep, which
 * keeps the table trimmed without new infrastructure. Deliberately runs OUTSIDE
 * the audit transaction and swallows its own errors — housekeeping must never
 * be the reason an admin's change fails.
 */
export async function purgeExpiredAuditLogs(): Promise<void> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - AUDIT_RETENTION_MONTHS);
  try {
    await prisma.adminAuditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  } catch (e) {
    console.error("[audit] retention sweep failed:", e);
  }
}

/** Roughly 1 in 50 writes runs the sweep. */
export const PURGE_SAMPLE_RATE = 0.02;

/** Fire-and-forget retention sweep. Safe to call after every audited action. */
export function maybePurgeAuditLogs(): void {
  if (Math.random() < PURGE_SAMPLE_RATE) void purgeExpiredAuditLogs();
}
