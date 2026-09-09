import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { expireOrderIfDue } from "@/lib/checkout/expire-orders";
import {
  PAYMENT_STATUS_LABEL,
  bankDetails,
  canSubmitReceipt,
  paymentWindowHours,
  timeRemaining,
  type BankPaymentStatus,
} from "@/lib/checkout/bank-transfer";
import { BankTransferPanel } from "@/components/checkout/bank-transfer-panel";

export const metadata: Metadata = {
  title: "Complete Your Bank Transfer | SherryBerries",
  robots: { index: false },
};

export default async function OrderPaymentPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/order/${encodeURIComponent(orderNumber)}/payment`);
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      total: true,
      paymentStatus: true,
      paymentExpiresAt: true,
      paymentRejectionReason: true,
      paymentReceipts: {
        orderBy: { uploadedAt: "desc" },
        select: { id: true, status: true, uploadedAt: true, fileType: true },
      },
    },
  });

  // Same response for "no such order" and "not yours": a 404 either way, so the
  // page cannot be used to discover which order numbers exist.
  if (!order || order.userId !== session.user.id) notFound();

  // Expire on read, so nobody is shown a payable order that has actually lapsed.
  if (await expireOrderIfDue(order.id)) {
    redirect(`/order/${encodeURIComponent(orderNumber)}/payment`);
  }

  const details = bankDetails();
  const status = order.paymentStatus as BankPaymentStatus;

  return (
    <BankTransferPanel
      orderNumber={order.orderNumber}
      amount={Number(order.total)}
      status={status}
      statusLabel={PAYMENT_STATUS_LABEL[status] ?? order.paymentStatus}
      remaining={timeRemaining(order.paymentExpiresAt)}
      windowHours={paymentWindowHours()}
      canSubmit={canSubmitReceipt(order.paymentStatus, order.paymentExpiresAt)}
      rejectionReason={order.paymentRejectionReason}
      details={details}
      receipts={order.paymentReceipts.map((r) => ({
        id: r.id,
        status: r.status,
        fileType: r.fileType,
        uploadedLabel: r.uploadedAt.toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      }))}
    />
  );
}
