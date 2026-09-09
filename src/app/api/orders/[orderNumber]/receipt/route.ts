import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, receiptLimiter, tooManyRequests } from "@/lib/rate-limit";
import { isR2Configured, uploadPaymentReceipt } from "@/lib/storage/r2";
import { canSubmitReceipt, receiptKey, validateReceipt } from "@/lib/checkout/bank-transfer";
import { expireOrderIfDue } from "@/lib/checkout/expire-orders";
import { sendReceiptSubmittedEmail } from "@/lib/email/resend";

// Proof-of-payment upload for a bank transfer order.
//
// The order is resolved from the URL and then checked against the SESSION's
// user id — never from anything in the request body. That is what stops a
// customer changing the order number to file a receipt against someone else's
// order (spec §27).
//
// What this endpoint does NOT do is mark anything paid. It moves the payment to
// PAYMENT_SUBMITTED, which means "a customer says they sent money". Only an
// admin who checked the bank account can move it to PAID.

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return bad("Please sign in.", 401);

  const rl = await checkRateLimit(receiptLimiter, userId);
  if (!rl.success) return tooManyRequests(rl.reset);

  if (!isR2Configured()) {
    console.error("[receipt] R2 is not configured — cannot accept proof of payment.");
    return bad("Uploads aren't available right now. Please contact us.", 503);
  }

  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      userId: true,
      orderNumber: true,
      paymentStatus: true,
      paymentExpiresAt: true,
      total: true,
      shipName: true,
      shipEmail: true,
      user: { select: { email: true, name: true } },
    },
  });

  // One answer for "no such order" and "not yours", so this cannot be used to
  // probe which order numbers exist.
  if (!order || order.userId !== userId) return bad("Order not found.", 404);

  // Settle expiry before deciding, so an order past its window is refused even
  // if no sweep has run yet.
  if (await expireOrderIfDue(order.id)) {
    return bad(
      "This order's payment window has closed and the items have been returned to stock. Please contact us if you have already sent the transfer.",
      409,
    );
  }

  if (!canSubmitReceipt(order.paymentStatus, order.paymentExpiresAt)) {
    // Distinguish the case an impatient customer will actually hit — a second
    // upload while the first is still queued — from everything else.
    if (order.paymentStatus === "PAYMENT_SUBMITTED") {
      return bad("We already have your receipt for this order and are reviewing it.", 409);
    }
    return bad("This order can no longer accept a payment receipt.", 409);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Expected a file upload.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return bad("No file was provided.");

  // Validated from the multipart part's own type and byte length, not from the
  // filename — a renamed executable must not get through.
  const check = validateReceipt(file.type, file.size);
  if (!check.ok) return bad(check.error);

  const key = receiptKey(order.orderNumber, check.extension, randomUUID());

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    await uploadPaymentReceipt(key, bytes, check.mime);
  } catch (e) {
    console.error("[receipt] upload failed for", order.orderNumber, e);
    return bad("We couldn't save that file. Please try again.", 502);
  }

  // Row and status together: a receipt that exists without moving the payment
  // out of AWAITING_PAYMENT would be silently ignored and then expired.
  const receipt = await prisma.$transaction(async (tx) => {
    const row = await tx.paymentReceipt.create({
      data: {
        orderId: order.id,
        fileKey: key,
        fileType: check.mime,
        fileSize: file.size,
      },
      select: { id: true, uploadedAt: true },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAYMENT_SUBMITTED",
        // Cleared so a previous rejection is not still shown beside a new
        // receipt the admin has not looked at yet.
        paymentRejectionReason: null,
      },
    });

    return row;
  });

  // Acknowledge the receipt by email. Awaited so a failure is logged with
  // the order it belongs to, but never fatal: the receipt is already saved
  // and the customer has the on-page confirmation either way.
  const emailTo = order.shipEmail || order.user?.email;
  if (emailTo) {
    const sent = await sendReceiptSubmittedEmail({
      to: emailTo,
      name: order.shipName || order.user?.name || null,
      orderNumber: order.orderNumber,
      amount: `$${Number(order.total).toFixed(2)} TTD`,
    });
    if (!sent.ok) {
      console.error(
        `[receipt] acknowledgement email failed for ${order.orderNumber}: ${sent.error}`,
      );
    }
  }

  return NextResponse.json({ ok: true, receiptId: receipt.id });
}
