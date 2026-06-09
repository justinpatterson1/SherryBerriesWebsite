import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import type {
  FulfillmentStatus,
  PaymentStatus,
} from "@/generated/prisma/client";

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
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  await prisma.order.update({ where: { id: orderId }, data });

  return NextResponse.json({ ok: true, status });
}
