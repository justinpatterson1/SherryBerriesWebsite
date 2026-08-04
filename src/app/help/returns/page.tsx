import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { RETURNS_POLICY_DOC } from "@/lib/legal/returns-policy";

export const metadata: Metadata = {
  title: "Returns Policy | SherryBerries",
  description:
    "What can and cannot be returned, how to start a return, refunds, exchanges, and what happens if an order arrives damaged or incorrect.",
};

export default function ReturnsPolicyPage() {
  return <LegalPage doc={RETURNS_POLICY_DOC} />;
}
