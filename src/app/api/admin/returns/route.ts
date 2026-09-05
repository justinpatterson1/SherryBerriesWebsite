import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  AUDIT_ACTIONS,
  auditIp,
  maybePurgeAuditLogs,
  writeAuditLog,
} from "@/lib/admin/audit";
import { prisma } from "@/lib/db";
import type { ReturnStatus } from "@/generated/prisma/client";

// Actioning a customer's return request. Without this the requests would land
// in a table nobody looks at — the same black hole the reviews feature fell
// into (open-issues #6).

const STATUSES: ReturnStatus[] = ["REQUESTED", "APPROVED", "REJECTED", "REFUNDED"];

// A rejected or refunded request is finished. Reopening one would leave the
// customer's status history lying about what happened, so the transition is
// refused rather than silently allowed.
const TERMINAL: ReturnStatus[] = ["REJECTED", "REFUNDED"];

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid JSON body.");
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const id = typeof b.id === "string" ? b.id : "";
  const status = typeof b.status === "string" ? (b.status as ReturnStatus) : null;
  const resolution = typeof b.resolution === "string" ? b.resolution.trim() : "";

  if (!id) return bad("Return id is required.");
  if (!status || !STATUSES.includes(status)) return bad("Unknown status.");
  if (resolution.length > 2000) return bad("Please keep the note under 2000 characters.");

  const existing = await prisma.returnRequest.findUnique({
    where: { id },
    select: { id: true, status: true, reference: true },
  });
  if (!existing) return bad("Return request not found.", 404);

  if (TERMINAL.includes(existing.status) && existing.status !== status) {
    return bad(
      `${existing.reference} is already ${existing.status.toLowerCase()} and cannot be reopened.`,
      409,
    );
  }

  // A rejection without a reason is the thing a customer will write in about,
  // so require one at the point it is easiest to give.
  if (status === "REJECTED" && !resolution) {
    return bad("Please say why the return was rejected — the customer sees this.");
  }

  // Audited in the same transaction: approving or refunding a return is a money
  // decision, and "who approved this, and why did they reject that one?" is the
  // question this log exists to answer. The rejection note is the admin's own
  // words about their decision, so it is recorded; the customer's details are
  // not — the reference points at the request, which already holds them.
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.returnRequest.update({
      where: { id },
      data: { status, ...(resolution ? { resolution } : {}) },
      select: { id: true, status: true, resolution: true, reference: true },
    });

    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.returnStatusChange,
      entityType: "ReturnRequest",
      entityId: id,
      summary: `${row.reference}: ${existing.status} → ${status}`,
      changes: {
        status: { from: existing.status, to: status },
        ...(resolution ? { resolution: { from: null, to: resolution } } : {}),
      },
      ip: auditIp(request),
    });

    return row;
  });
  maybePurgeAuditLogs();

  return NextResponse.json({ ok: true, request: updated });
}
