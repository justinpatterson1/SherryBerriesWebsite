import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccountData } from "@/lib/queries/account";
import { AccountClient } from "@/components/account/account-client";

export const metadata: Metadata = {
  title: "My Account | SherryBerries",
  description: "Your orders, returns, addresses, and profile — all in one place.",
  robots: { index: false },
};

export default async function AccountPage() {
  // Signed-in customers only — mirrors /wishlist and the proxy matcher gate.
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const data = await getAccountData(session.user.id);
  if (!data) redirect("/login?callbackUrl=/account");

  return <AccountClient initial={data} />;
}
