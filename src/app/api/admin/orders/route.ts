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
import { canMarkPaid } from "@/lib/checkout/payment-transitions";
import { unlockDigitalDownloads } from "@/lib/checkout/digital-delivery";
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

  const { orderId, status, action } = (body ?? {}) as Record<string, unknown>;
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  // Recording that money arrived is a payment transition, not a fulfilment
  // one, so it is its own action rather than another entry in the status
  // dropdown — which only ever writes fulfillmentStatus.
  if (action === "markPaid") {
    return markPaid(orderId, admin, request);
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

/**
 * Record that a PENDING order's money was collected.
 *
 * Exists because nothing else could: the status dropdown writes only
 * fulfillment, and /api/admin/payments handles bank transfers alone, so a cash
 * order had no way to ever reach PAID. That also left any download on a COD
 * order permanently locked, since the unlock is keyed on PAID.
 *
 * Fulfillment is deliberately untouched. Cash is usually collected on delivery,
 * so forcing the order back to PROCESSING would undo what actually happened.
 */
async function markPaid(
  orderId: string,
  admin: Awaited<ReturnType<typeof requireAdmin>> & object,
  request: Request,
) {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      paymentStatus: true,
      paymentMethod: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!canMarkPaid(existing.paymentStatus)) {
    return NextResponse.json(
      {
        error:
          existing.paymentStatus === "PAID"
            ? `${existing.orderNumber} is already paid.`
            : `${existing.orderNumber} is ${existing.paymentStatus.toLowerCase().replace(/_/g, " ")}, so it cannot be marked paid here.`,
      },
      { status: 409 },
    );
  }

  const amount = Number(existing.total).toFixed(2);
  const claimed = await prisma.$transaction(async (tx) => {
    // Guarded, so two admins clicking at once cannot both record the payment.
    const res = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: "PENDING" },
      data: {
        paymentStatus: "PAID",
        paymentVerifiedAt: new Date(),
        paymentVerifiedById: admin.id,
      },
    });
    if (res.count !== 1) return false;

    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.paymentMarkedPaid,
      entityType: "Order",
      entityId: orderId,
      summary: `${existing.orderNumber}: marked paid by hand: $${amount} via ${existing.paymentMethod ?? "unknown method"}`,
      changes: { paymentStatus: { from: existing.paymentStatus, to: "PAID" } },
      ip: auditIp(request),
    });
    return true;
  });

  if (!claimed) {
    return NextResponse.json({ error: "That order was already resolved." }, { status: 409 });
  }
  maybePurgeAuditLogs();

  // Any download on this order is now unlocked. Outside the transaction, so it
  // can see the committed status.
  await unlockDigitalDownloads(orderId, { baseUrl: new URL(request.url).origin });

  return NextResponse.json({ ok: true, paymentStatus: "PAID" });
}
