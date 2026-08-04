import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { SHIPPING_POLICY_DOC } from "@/lib/legal/shipping-policy";

export const metadata: Metadata = {
  title: "Shipping Policy | SherryBerries",
  description:
    "Where SherryBerries delivers in Trinidad and Tobago, shipping rates and delivery estimates, order processing times, tracking, and what happens if a delivery is delayed or damaged.",
};

export default function ShippingPolicyPage() {
  return <LegalPage doc={SHIPPING_POLICY_DOC} />;
}
