import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  AUDIT_ACTIONS,
  auditIp,
  maybePurgeAuditLogs,
  writeAuditLog,
} from "@/lib/admin/audit";
import { prisma } from "@/lib/db";
import {
  canReviewPayment,
  isRejectionReason,
  paymentDeadline,
} from "@/lib/checkout/bank-transfer";
import { revalidateCatalog } from "@/lib/admin/revalidate";
import {
  sendPaymentConfirmedEmail,
  sendPaymentRejectedEmail,
} from "@/lib/email/resend";

// Confirming or rejecting a bank transfer.
//
// This route is the ONLY way a bank transfer becomes PAID. The customer's
// upload gets it to PAYMENT_SUBMITTED; an admin who has looked at the actual
// bank account decides the rest. Both actions are audited with the acting
// admin, because "who said this money arrived?" has to be answerable.
//
// Both are idempotent: the status flip is a guarded updateMany, so a
// double-clicked Confirm cannot commit stock twice or email twice.

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

  const orderId = typeof b.orderId === "string" ? b.orderId : "";
  if (!orderId) return bad("Order id is required.");

  const action = b.action;
  if (action !== "confirm" && action !== "reject") {
    return bad("Action must be confirm or reject.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      paymentStatus: true,
      paymentMethod: true,
      shipName: true,
      shipEmail: true,
      user: { select: { email: true, name: true } },
      paymentReceipts: {
        orderBy: { uploadedAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!order) return bad("Order not found.", 404);

  if (!canReviewPayment(order.paymentStatus)) {
    return bad(
      `${order.orderNumber} is ${order.paymentStatus.toLowerCase().replace(/_/g, " ")}, so there is nothing to review.`,
      409,
    );
  }

  const latestReceiptId = order.paymentReceipts[0]?.id ?? null;
  // The address the order was placed with, falling back to the account.
  const emailTo = order.shipEmail || order.user?.email || null;
  const emailName = order.shipName || order.user?.name || null;
  const amount = Number(order.total).toFixed(2);
  const ip = auditIp(request);

  if (action === "confirm") {
    const now = new Date();
    const done = await prisma.$transaction(async (tx) => {
      // Guarded, so two admins clicking Confirm at once cannot both proceed.
      const claimed = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: "PAYMENT_SUBMITTED" },
        data: {
          paymentStatus: "PAID",
          // Verified payment moves the order into fulfilment, per spec §15.
          fulfillmentStatus: "PROCESSING",
          paymentVerifiedAt: now,
          paymentVerifiedById: admin.id,
          paymentRejectionReason: null,
        },
      });
      if (claimed.count !== 1) return false;

      if (latestReceiptId) {
        await tx.paymentReceipt.update({
          where: { id: latestReceiptId },
          data: { status: "ACCEPTED" },
        });
      }

      // Stock was already decremented at checkout, so confirming commits
      // nothing further — which is what makes this safe to retry.
      await writeAuditLog(tx, {
        actor: admin,
        action: AUDIT_ACTIONS.paymentConfirmed,
        entityType: "Order",
        entityId: order.id,
        summary: `${order.orderNumber}: confirmed $${amount} received by bank transfer`,
        changes: { paymentStatus: { from: "PAYMENT_SUBMITTED", to: "PAID" } },
        ip,
      });

      return true;
    });

    if (!done) return bad("That payment was already reviewed.", 409);
    maybePurgeAuditLogs();
    revalidateCatalog();

    // Sent only from here, after a human confirmed the funds arrived — this
    // is the one email that tells the customer they have paid.
    if (emailTo) {
      const sent = await sendPaymentConfirmedEmail({
        to: emailTo,
        name: emailName,
        orderNumber: order.orderNumber,
        amount: `$${amount} TTD`,
      });
      if (!sent.ok) {
        console.error(
          `[payments] confirmation email failed for ${order.orderNumber}: ${sent.error}`,
        );
      }
    }
    return NextResponse.json({ ok: true, orderId: order.id, paymentStatus: "PAID" });
  }

  // --- reject ---
  const rawReason = typeof b.reason === "string" ? b.reason.trim() : "";
  if (!rawReason) return bad("Please choose a reason.");
  // Checked against the list rather than accepted as free text: the reason is
  // shown to the customer and stored on the order, so it should not be able to
  // become arbitrary content from a crafted request.
  if (!isRejectionReason(rawReason)) return bad("That is not a valid reason.");
  const notes = typeof b.notes === "string" ? b.notes.trim().slice(0, 1000) : "";
  const reason = notes ? `${rawReason} — ${notes}` : rawReason;

  const done = await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: order.id, paymentStatus: "PAYMENT_SUBMITTED" },
      data: {
        paymentStatus: "REJECTED",
        paymentRejectionReason: reason,
        // A fresh window, so the customer has time to transfer again and
        // resubmit — and so the order cannot hold its stock indefinitely if
        // they never do. Without this a rejection was a dead end that only a
        // manual cancellation could clear.
        paymentExpiresAt: paymentDeadline(new Date()),
      },
    });
    if (claimed.count !== 1) return false;

    // The file itself is kept, not deleted: a rejected receipt is part of why
    // the order was refused.
    if (latestReceiptId) {
      await tx.paymentReceipt.update({
        where: { id: latestReceiptId },
        data: { status: "REJECTED" },
      });
    }

    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.paymentRejected,
      entityType: "Order",
      entityId: order.id,
      summary: `${order.orderNumber}: rejected $${amount} bank transfer — ${rawReason}`,
      changes: { paymentStatus: { from: "PAYMENT_SUBMITTED", to: "REJECTED" } },
      ip,
    });

    return true;
  });

  if (!done) return bad("That payment was already reviewed.", 409);
  maybePurgeAuditLogs();

  if (emailTo) {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    const sent = await sendPaymentRejectedEmail({
      to: emailTo,
      name: emailName,
      orderNumber: order.orderNumber,
      amount: `$${amount} TTD`,
      reason,
      paymentUrl: `${base}/order/${encodeURIComponent(order.orderNumber)}/payment`,
    });
    if (!sent.ok) {
      console.error(
        `[payments] rejection email failed for ${order.orderNumber}: ${sent.error}`,
      );
    }
  }
  // Stock stays decremented on a rejection: the customer can transfer again and
  // resubmit, and releasing it would let the order become unfulfillable while
  // they do. It is released only by expiry or an explicit cancellation.
  return NextResponse.json({ ok: true, orderId: order.id, paymentStatus: "REJECTED" });
}

