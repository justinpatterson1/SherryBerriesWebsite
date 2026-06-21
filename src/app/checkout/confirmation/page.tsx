import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildPlacedOrder } from "@/lib/checkout/order-view";
import { ThankYou } from "@/components/checkout/thank-you";

export const metadata: Metadata = {
  title: "Order Confirmed | SherryBerries",
  description: "Your SherryBerries order is confirmed.",
  robots: { index: false },
};

// Where WiPay's verified callback lands the payor after a successful card
// payment. Loads the (owner's) paid order and renders the shared Thank-You.
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");

  const { order: orderNumber } = await searchParams;
  if (!orderNumber) redirect("/checkout");

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      orderItems: {
        include: {
          product: { select: { name: true, material: true } },
          variant: { select: { value: true } },
        },
      },
    },
  });

  // Only the owner sees it, and only once the payment actually cleared.
  if (!order || order.userId !== session.user.id) redirect("/checkout");
  if (order.paymentStatus !== "PAID") redirect("/checkout?wipay=pending");

  const placed = buildPlacedOrder(order);

  return (
    <main className="pt-[110px] pb-[100px] max-[900px]:pt-[100px] max-[900px]:pb-20 px-[8%] max-[900px]:px-[6%]">
      <ThankYou order={placed} />
    </main>
  );
}
