import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { getAdminData } from "@/lib/queries/admin";
import { AdminClient } from "@/components/admin/admin-client";

export const metadata: Metadata = {
  title: "Control Room | SherryBerries",
  description: "Store admin — orders, inventory, and analytics.",
  robots: { index: false },
};

export default async function AdminPage() {
  // Admins only. Guests → login; signed-in non-admins → home.
  const admin = await requireAdmin();
  if (!admin) {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
    redirect("/");
  }

  const data = await getAdminData();
  return <AdminClient data={data} admin={{ name: admin.name, email: admin.email }} />;
}
