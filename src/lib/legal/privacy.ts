// Editable content for the /privacy page. The wording here is the owner-supplied
// legal copy (see context/features/privacy-policy-spec.md) rendered verbatim —
// only structure, headings, and styling are adapted to the design system. Keep
// the sentences intact; edit copy here rather than in the page layout.
//
// Plain static data — safe to import from server or client components.

import type { Block, LegalDocument, Section } from "@/lib/legal/types";

/**
 * Rendered in the hero and referenced by "Changes to This Privacy Policy".
 * Bumped on 2026-08-08: removed the Google Analytics references and the
 * traffic-measurement cookie purpose, none of which the site actually does.
 */
export const LAST_UPDATED = "August 16, 2026";

export const SITE_URL = "https://www.sherryberries.com";
export const PRIVACY_EMAIL = "sherryvanessanichols@gmail.com";

const INTRO: Block[] = [
  {
    kind: "p",
    text: [
      { b: "Sherry Berries Body Jewelry and Accessories" },
      ' ("SherryBerries", "we", "our", or "us") operates ',
      { href: "http://www.sherryberries.com", text: "www.sherryberries.com" },
      ' (the "Website").',
    ],
  },
  {
    kind: "p",
    text: "This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you visit our Website, create an account, place an order, leave a review, or otherwise interact with our services.",
  },
  {
    kind: "p",
    text: "By using our Website, you agree to the collection and use of information in accordance with this Privacy Policy.",
  },
];

const SECTIONS: Section[] = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    chip: "What we collect",
    kicker: "Collection",
    blocks: [
      { kind: "p", text: "Depending on how you use our Website, we may collect the following information:" },

      { kind: "sub", title: "Personal Information" },
      {
        kind: "list",
        items: ["Full name", "Email address", "Shipping and billing address", "Telephone number"],
      },

      { kind: "sub", title: "Account Information" },
      { kind: "p", text: "When you create an account, we collect:" },
      {
        kind: "list",
        items: ["Email address", "Encrypted password", "Account preferences", "Order history"],
      },
      { kind: "p", text: "Passwords are securely encrypted and are never stored in plain text." },

      { kind: "sub", title: "Order Information" },
      { kind: "p", text: "When you place an order we collect information necessary to:" },
      {
        kind: "list",
        items: [
          "Process your purchase",
          "Deliver your order",
          "Provide customer support",
          "Maintain records of previous purchases",
        ],
      },

      { kind: "sub", title: "Payment Information" },
      {
        kind: "p",
        text: ["Payments made through our Website are securely processed by ", { b: "WiPay" }, "."],
      },
      {
        kind: "p",
        text: [
          "We do ",
          { b: "not" },
          " store your debit card or credit card details on our servers. Payment information is collected and processed directly by WiPay in accordance with its own Privacy Policy.",
        ],
      },

      { kind: "sub", title: "Automatically Collected Information" },
      { kind: "p", text: "When you visit our Website we may automatically collect:" },
      {
        kind: "list",
        items: [
          "IP address",
          "Browser type",
          "Device information",
          "Operating system",
          "Pages visited",
          "Time spent on pages",
          "Referral information",
        ],
      },

      { kind: "sub", title: "Cookies" },
      { kind: "p", text: "We use cookies and similar technologies to:" },
      {
        kind: "list",
        items: [
          "Keep you signed in",
          "Remember your shopping cart",
          "Save your preferences",
          "Improve website performance",
          "Enhance your shopping experience",
        ],
      },
      {
        kind: "p",
        text: "You may disable cookies through your browser settings, although doing so may affect certain features of the Website.",
      },
    ],
  },
  {
    id: "how-we-use-your-information",
    title: "How We Use Your Information",
    chip: "How we use it",
    kicker: "Use",
    blocks: [
      { kind: "p", text: "We use your information to:" },
      {
        kind: "list",
        items: [
          "Create and manage your account",
          "Process and fulfill orders",
          "Deliver products",
          "Respond to customer inquiries",
          "Send order confirmations and shipping updates",
          "Improve our Website",
          "Detect fraud and unauthorized activity",
          "Maintain the security of our Website",
          "Send promotional emails and newsletters when you have chosen to receive them",
          "Comply with legal obligations",
        ],
      },
    ],
  },
  {
    id: "customer-reviews",
    title: "Customer Reviews",
    chip: "Reviews",
    kicker: "Reviews",
    blocks: [
      {
        kind: "p",
        text: "We do not currently accept product reviews, testimonials, or ratings on the Website, so we hold no such content about you.",
      },
      {
        kind: "p",
        text: "If we introduce reviews, anything you submit may become publicly visible on the Website, and we would ask you to avoid including sensitive personal information in one.",
      },
    ],
  },
  {
    id: "third-party-services",
    title: "Third Party Services",
    chip: "Third parties",
    kicker: "Providers",
    blocks: [
      { kind: "p", text: "We work with trusted third party providers that help us operate our business." },
      { kind: "p", text: "These providers may include:" },
      {
        kind: "list",
        items: [
          [{ b: "WiPay" }, " for secure payment processing"],
          "Email service providers for transactional and marketing emails",
          "Website hosting and infrastructure providers",
        ],
      },
      {
        kind: "p",
        text: "These providers only receive the information necessary to perform services on our behalf.",
      },
    ],
  },
  {
    id: "information-sharing",
    title: "Information Sharing",
    chip: "Sharing",
    kicker: "Sharing",
    blocks: [
      { kind: "p", text: "We value your privacy." },
      {
        kind: "p",
        text: ["We ", { b: "do not sell, rent, or trade" }, " your personal information."],
      },
      {
        kind: "p",
        text: "We may share information only when necessary with trusted third parties including:",
      },
      {
        kind: "list",
        items: [
          "Payment processors",
          "Shipping providers",
          "Email service providers",
          "Website hosting providers",
        ],
      },
      {
        kind: "p",
        text: "We may also disclose information when required by law or when necessary to protect our legal rights.",
      },
    ],
  },
  {
    id: "data-retention",
    title: "Data Retention",
    chip: "Retention",
    kicker: "Retention",
    blocks: [
      { kind: "p", text: "We retain your information only for as long as necessary to:" },
      {
        kind: "list",
        items: [
          "Maintain your customer account",
          "Fulfill orders",
          "Provide customer support",
          "Prevent fraud",
          "Meet accounting and tax obligations",
          "Comply with legal requirements",
        ],
      },
      {
        kind: "p",
        text: "If you request deletion of your account, we will remove or anonymize your personal information where legally permitted. Certain records may be retained where required by law.",
      },
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    chip: "Security",
    kicker: "Security",
    blocks: [
      {
        kind: "p",
        text: "We take reasonable administrative, technical, and physical measures to protect your personal information.",
      },
      { kind: "p", text: "These measures include:" },
      {
        kind: "list",
        items: [
          "Secure HTTPS encryption",
          "Password encryption",
          "Restricted access to customer information",
          "Secure hosting environments",
          "Regular software updates",
        ],
      },
      {
        kind: "p",
        text: "Although we strive to protect your information, no method of electronic transmission or storage can be guaranteed to be completely secure.",
      },
    ],
  },
  {
    id: "international-data-processing",
    title: "International Data Processing",
    chip: "International",
    kicker: "Transfers",
    blocks: [
      {
        kind: "p",
        text: "Some of our trusted service providers may process or store information outside of Trinidad and Tobago.",
      },
      {
        kind: "p",
        text: "By using our Website, you acknowledge that your information may be transferred to countries with different data protection laws.",
      },
    ],
  },
  {
    id: "your-rights-gdpr",
    title: "Your Rights (GDPR)",
    chip: "Your rights",
    kicker: "EEA rights",
    blocks: [
      {
        kind: "p",
        text: "If you are located within the European Economic Area (EEA), you may have the following rights:",
      },
      {
        kind: "list",
        items: [
          "Access your personal information",
          "Correct inaccurate information",
          "Request deletion of your information",
          "Restrict processing",
          "Object to processing",
          "Request a copy of your information in a portable format",
        ],
      },
      { kind: "p", text: "To exercise these rights, contact us using the information below." },
    ],
  },
  {
    id: "california-privacy-rights",
    title: "California Privacy Rights (CCPA)",
    chip: "California",
    kicker: "CCPA",
    blocks: [
      { kind: "p", text: "If you are a California resident, you may have the right to:" },
      {
        kind: "list",
        items: [
          "Know what personal information we collect",
          "Request deletion of your personal information",
          "Request information about how your data is used",
          "Opt out of the sale of personal information",
        ],
      },
      { kind: "p", text: ["SherryBerries does ", { b: "not sell" }, " personal information."] },
    ],
  },
  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    chip: "Children",
    kicker: "Under 13",
    blocks: [
      { kind: "p", text: "Our Website is not intended for children under the age of 13." },
      {
        kind: "p",
        text: "We do not knowingly collect personal information from children under 13. If you believe that a child has provided us with personal information, please contact us so that we can remove it.",
      },
    ],
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to This Privacy Policy",
    chip: "Changes",
    kicker: "Updates",
    blocks: [
      { kind: "p", text: "We may update this Privacy Policy from time to time." },
      {
        kind: "p",
        text: 'Any changes will be posted on this page along with the updated "Last Updated" date.',
      },
      { kind: "p", text: "We encourage you to review this Privacy Policy periodically." },
    ],
  },
];

export const PRIVACY_DOC: LegalDocument = {
  breadcrumb: "Privacy Policy",
  eyebrow: "Legal · Sherry Berries Body Jewelry and Accessories",
  title: "Privacy",
  titleAccent: "policy",
  lastUpdated: LAST_UPDATED,
  intro: INTRO,
  sections: SECTIONS,
  contact: {
    id: "contact-us",
    title: "Contact Us",
    chip: "Contact",
    kicker: "Get in touch",
    intro:
      "If you have any questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:",
    email: PRIVACY_EMAIL,
    website: SITE_URL,
  },
};
