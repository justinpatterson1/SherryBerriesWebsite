import type { Metadata } from "next";
import { CartClient } from "@/components/cart/cart-client";

export const metadata: Metadata = {
  title: "Your bag | SherryBerries",
  description: "Review your jewelry & aftercare picks before checkout.",
};

export default function CartPage() {
  return <CartClient />;
}
