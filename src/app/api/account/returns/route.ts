import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isFinalSale, isReasonAllowed } from "@/lib/account/returns";

// Opening a return request. Until this existed the account view could only
// point the customer at /contact, so a return was an email thread with no
// record and no status anyone could check (open-issues #16).

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/**
 * RT-#### reference, retried on the vanishingly unlikely collision. Short
 * enough to quote over the phone; `reference` is @unique so a duplicate would
 * throw rather than silently reuse.
 */
async function uniqueReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const reference = `RT-${Math.floor(1000 + Math.random() * 9000)}`;
    const clash = await prisma.returnRequest.findUnique({
      where: { reference },
      select: { id: true },
    });
    if (!clash) return reference;
  }
  // Fall back to something that cannot collide rather than failing the request.
  return `RT-${Date.now().toString().slice(-8)}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return bad("Please sign in to open a return.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid JSON body.");
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const orderItemId = str(b.orderItemId);
  const reason = str(b.reason);
  const notes = str(b.notes);

  if (!orderItemId) return bad("Please choose the item you want to return.");
  if (!reason) return bad("Please choose a reason.");
  if (notes.length > 2000) return bad("Please keep the details under 2000 characters.");

  // Load the item through the order so ownership, delivery state and category
  // are all checked from the database rather than trusted from the request.
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: {
      id: true,
      order: { select: { id: true, userId: true, fulfillmentStatus: true } },
      product: { select: { name: true, category: { select: { slug: true } } } },
    },
  });

  if (!item || item.order.userId !== session.user.id) {
    return bad("We couldn't find that item on any of your orders.", 404);
  }
  if (item.order.fulfillmentStatus !== "DELIVERED") {
    return bad("Returns can only be opened once an order has been delivered.");
  }

  const categorySlug = item.product.category.slug;
  if (!isReasonAllowed(categorySlug, reason)) {
    // Either the reason is not on the published list at all, or it is
    // change-of-mind against a final-sale item, which the policy refuses.
    return isFinalSale(categorySlug)
      ? bad(
          `${item.product.name} is a final sale item, so it can only be returned if it arrived damaged, defective, or was not what you ordered.`,
        )
      : bad("Please choose a reason from the list.");
  }

  const existing = await prisma.returnRequest.findFirst({
    where: {
      orderItemId,
      status: { in: ["REQUESTED", "APPROVED"] },
    },
    select: { reference: true },
  });
  if (existing) {
    return bad(`You already have an open return for this item (${existing.reference}).`, 409);
  }

  const created = await prisma.returnRequest.create({
    data: {
      reference: await uniqueReference(),
      userId: session.user.id,
      orderId: item.order.id,
      orderItemId,
      reason,
      notes: notes || null,
    },
    select: { id: true, reference: true, status: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, request: created });
}
