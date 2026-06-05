import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata: Metadata = {
  title: "Secure Checkout | SherryBerries",
  description: "Complete your SherryBerries order.",
  robots: { index: false },
};

export default async function CheckoutPage() {
  // Real orders need a user — guests sign in first (mirrors /account, /wishlist).
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      name: true,
      email: true,
      phoneNumber: true,
      addresses: {
        where: { isDefault: true },
        take: 1,
        select: { addressLine1: true, city: true },
      },
    },
  });

  const def = user?.addresses[0];
  const nameParts = user?.name?.split(" ") ?? [];

  return (
    <CheckoutClient
      initial={{
        firstName: user?.firstName ?? nameParts[0] ?? "",
        lastName: user?.lastName ?? nameParts.slice(1).join(" ") ?? "",
        email: user?.email ?? session.user.email ?? "",
        phone: user?.phoneNumber ?? "",
        line1: def?.addressLine1 ?? "",
        city: def?.city ?? "",
      }}
    />
  );
}
