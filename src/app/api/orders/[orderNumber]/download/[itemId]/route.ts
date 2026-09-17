import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { fetchDigitalAsset } from "@/lib/storage/r2";
import { downloadFilename } from "@/lib/checkout/digital";
import { canDownloadDigital } from "@/lib/checkout/payment-transitions";
import { checkRateLimit, downloadLimiter, tooManyRequests } from "@/lib/rate-limit";

// Streams a purchased download to the person who bought it.
//
// This is the ONLY way to read a digital product: the object lives under an
// unguessable key and is never given out as a public URL. Authorisation runs on
// every request — the customer who owns the order, or any admin.
//
// There is deliberately no signed-link mode and no expiry. A link that outlives
// the check is what the receipt route (spec §27) avoids, and here it would also
// be wrong on its own terms: the buyer owns this file, so the link has to keep
// working indefinitely. Re-checking per request is what makes that safe.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string; itemId: string }> },
) {
  const { orderNumber, itemId } = await params;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // A permanent route that streams a multi-MB file is cheap bandwidth
  // amplification for a signed-in caller, so it is metered per account.
  const limit = await checkRateLimit(downloadLimiter, `download:${userId}`);
  if (!limit.success) {
    return tooManyRequests(limit.reset);
  }

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    select: {
      product: {
        select: { name: true, isDigital: true, digitalFileKey: true, digitalFileName: true },
      },
      order: { select: { userId: true, orderNumber: true, paymentStatus: true } },
    },
  });

  // The item must belong to the order in the URL as well as exist: without that
  // check, any item id would be readable through any order number the caller
  // happens to own.
  if (!item || item.order.orderNumber !== orderNumber) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const isOwner = item.order.userId === userId;
  let isAdmin = false;
  if (!isOwner) {
    const viewer = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    isAdmin = viewer?.role === "ADMIN" || viewer?.role === "SUPERADMIN";
  }
  // 404 rather than 403, so this cannot confirm to a stranger that an order or
  // a purchase exists.
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const key = item.product.digitalFileKey;
  if (!item.product.isDigital || !key) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Admins may fetch the file on an unpaid order, to check what a customer
  // will receive. For the buyer it stays locked until the money is in.
  if (!isAdmin && !canDownloadDigital(item.order.paymentStatus, item.product.isDigital, true)) {
    // 403, not 404, and only because we have already established this is the
    // owner: they can see the item on their own order page, so pretending it
    // does not exist would just generate a support ticket.
    return NextResponse.json(
      { error: "This download unlocks once your payment is confirmed." },
      { status: 403 },
    );
  }

  const file = await fetchDigitalAsset(key);
  if (!file) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const filename = downloadFilename(item.product.digitalFileName ?? item.product.name);

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      // attachment, not inline: this is a document the buyer keeps.
      "Content-Disposition": `attachment; filename="${filename}"`,
      // nosniff so a crafted file cannot be interpreted as something executable.
      "X-Content-Type-Options": "nosniff",
      // Never cached by a shared cache: the authorisation above is per-request.
      "Cache-Control": "private, no-store",
    },
  });
}
