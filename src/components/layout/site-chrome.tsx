"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

// The admin control room (`/admin`) renders its own floating-pill nav + sidebar,
// so the store chrome is suppressed there. Everywhere else it renders as before.
function isAdminRoute(pathname: string | null): boolean {
  return !!pathname && pathname.startsWith("/admin");
}

export function SiteNavbar() {
  const pathname = usePathname();
  if (isAdminRoute(pathname)) return null;
  return <Navbar />;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (isAdminRoute(pathname)) return null;
  return <Footer />;
}
