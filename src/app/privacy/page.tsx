import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY_DOC } from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | SherryBerries",
  description:
    "How SherryBerries collects, uses, shares, and protects your personal information — including payments, cookies, data retention, and your privacy rights.",
};

export default function PrivacyPolicyPage() {
  return <LegalPage doc={PRIVACY_DOC} />;
}
