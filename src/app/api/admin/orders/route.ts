import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  AUDIT_ACTIONS,
  auditIp,
  diffFields,
  hasChanges,
  maybePurgeAuditLogs,
  writeAuditLog,
  type ChangeSet,
} from "@/lib/admin/audit";
import { prisma } from "@/lib/db";
import type {
  FulfillmentStatus,
  PaymentStatus,
} from "@/generated/prisma/client";

/** "Processing → Shipped", or both transitions when payment changed too. */
function describeOrderChange(changes: ChangeSet): string {
  return Object.values(changes)
    .map((c) => `${String(c.from)} → ${String(c.to)}`)
    .join(", ");
}

const STATUS_TO_FULFILLMENT: Record<string, FulfillmentStatus> = {
  Pending: "UNFULFILLED",
  Processing: "PROCESSING",
  Shipped: "SHIPPED",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
};

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { orderId, status } = (body ?? {}) as Record<string, unknown>;
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }
  if (typeof status !== "string") {
    return NextResponse.json({ error: "status is required." }, { status: 400 });
  }

  const data: { fulfillmentStatus?: FulfillmentStatus; paymentStatus?: PaymentStatus } = {};
  if (status === "Refunded") {
    // Refunded is a payment state; the fulfillment status is left intact.
    data.paymentStatus = "REFUNDED";
  } else if (status in STATUS_TO_FULFILLMENT) {
    data.fulfillmentStatus = STATUS_TO_FULFILLMENT[status];
  } else {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      fulfillmentStatus: true,
      paymentStatus: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const changes = diffFields(existing, data, ["fulfillmentStatus", "paymentStatus"]);

  // Audited in the same transaction as the change: money moves here, so a
  // status change must not be able to land unrecorded. The log stores the
  // order NUMBER and the transition — never the customer's details.
  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data });
    if (hasChanges(changes)) {
      await writeAuditLog(tx, {
        actor: admin,
        action: AUDIT_ACTIONS.orderStatusChange,
        entityType: "Order",
        entityId: orderId,
        summary: `${existing.orderNumber}: ${describeOrderChange(changes)}`,
        changes,
        ip: auditIp(request),
      });
    }
  });
  maybePurgeAuditLogs();

  return NextResponse.json({ ok: true, status });
}
