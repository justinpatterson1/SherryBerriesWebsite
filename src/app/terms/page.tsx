import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { TERMS_DOC } from "@/lib/legal/terms";

export const metadata: Metadata = {
  title: "Terms of Service | SherryBerries",
  description:
    "The terms governing your use of SherryBerries — eligibility, accounts, orders, pricing, payments, shipping, returns, acceptable use, and liability.",
};

export default function TermsOfServicePage() {
  return <LegalPage doc={TERMS_DOC} />;
}
