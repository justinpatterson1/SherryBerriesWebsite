import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { fetchPaymentReceipt } from "@/lib/storage/r2";

// Streams one payment receipt to someone allowed to see it.
//
// Receipts live in the bucket under an unguessable key and are never given out
// as a public URL, so this route is the only way to read one. It authorises on
// every request: the customer who owns the order, or any admin. There is no
// signed-link mode, because a link that outlives the check is exactly what
// spec §27 is trying to avoid.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string; receiptId: string }> },
) {
  const { orderNumber, receiptId } = await params;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id: receiptId },
    select: {
      fileKey: true,
      fileType: true,
      order: { select: { userId: true, orderNumber: true } },
    },
  });

  // The receipt must belong to the order in the URL as well as exist: without
  // that check, any valid receipt id would be readable through any order number
  // the caller happens to own.
  if (!receipt || receipt.order.orderNumber !== orderNumber) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let allowed = receipt.order.userId === userId;
  if (!allowed) {
    const viewer = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    allowed = viewer?.role === "ADMIN" || viewer?.role === "SUPERADMIN";
  }
  // 404 rather than 403, so this cannot confirm that a receipt exists to
  // someone who may not see it.
  if (!allowed) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const file = await fetchPaymentReceipt(receipt.fileKey);
  if (!file) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": receipt.fileType || file.contentType,
      // inline so an admin can eyeball it in the browser; nosniff so a crafted
      // file cannot be interpreted as something executable.
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      // Never cached by a shared cache: the authorisation above is per-request.
      "Cache-Control": "private, no-store",
    },
  });
}
