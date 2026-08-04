// Editable content for the /terms page. The wording here is the owner-supplied
// legal copy (see context/features/terms-of-service-spec.md) rendered verbatim —
// only structure, headings, and styling are adapted to the design system. Keep
// the sentences intact; edit copy here rather than in the page layout.
//
// Plain static data — safe to import from server or client components.

import type { Block, LegalDocument, Section } from "@/lib/legal/types";

/** Rendered in the hero and referenced by "Changes to These Terms". */
export const LAST_UPDATED = "August 1, 2026";

export const SITE_URL = "https://www.sherryberries.com";
export const TERMS_EMAIL = "sherryvanessanichols@gmail.com";

// The source copy's "Agreement to These Terms" section — shown in the hero
// without its own heading, matching how /privacy renders its "Introduction".
const INTRO: Block[] = [
  {
    kind: "p",
    text: [
      "Welcome to ",
      { b: "Sherry Berries Body Jewelry and Accessories" },
      ' ("SherryBerries", "we", "our", or "us").',
    ],
  },
  {
    kind: "p",
    text: [
      'These Terms of Service ("Terms") govern your access to and use of ',
      { href: "http://www.sherryberries.com", text: "www.sherryberries.com" },
      ' (the "Website"), including browsing our products, creating an account, placing orders, leaving reviews, and using any services offered through our Website.',
    ],
  },
  {
    kind: "p",
    text: "By accessing or using our Website, you agree to be bound by these Terms. If you do not agree, please do not use our Website.",
  },
];

const SECTIONS: Section[] = [
  {
    id: "eligibility",
    title: "Eligibility",
    chip: "Eligibility",
    kicker: "Who can buy",
    blocks: [
      {
        kind: "p",
        text: "You must be at least 18 years old, or have the permission of a parent or legal guardian, to make purchases through our Website.",
      },
      {
        kind: "p",
        text: "By placing an order, you represent that the information you provide is accurate and complete.",
      },
    ],
  },
  {
    id: "customer-accounts",
    title: "Customer Accounts",
    chip: "Accounts",
    kicker: "Your account",
    blocks: [
      { kind: "p", text: "You may create an account to access certain features of the Website." },
      { kind: "p", text: "You are responsible for:" },
      {
        kind: "list",
        items: [
          "Maintaining the confidentiality of your account credentials.",
          "Keeping your account information up to date.",
          "All activities that occur under your account.",
        ],
      },
      {
        kind: "p",
        text: "You agree to notify us immediately if you believe your account has been accessed without authorization.",
      },
    ],
  },
  {
    id: "orders",
    title: "Orders",
    chip: "Orders",
    kicker: "Acceptance",
    blocks: [
      { kind: "p", text: "Submitting an order does not automatically guarantee acceptance." },
      { kind: "p", text: "We reserve the right to:" },
      {
        kind: "list",
        items: [
          "Refuse or cancel any order.",
          "Limit quantities purchased.",
          "Request additional verification before processing an order.",
          "Cancel orders suspected of fraud or misuse.",
        ],
      },
      {
        kind: "p",
        text: "If payment has already been received for a cancelled order, any applicable refund will be processed through the original payment method.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    chip: "Pricing",
    kicker: "Prices",
    blocks: [
      {
        kind: "p",
        text: [
          "All prices displayed on the Website are shown in ",
          { b: "Trinidad and Tobago Dollars (TTD)" },
          " unless otherwise stated.",
        ],
      },
      { kind: "p", text: "We reserve the right to:" },
      {
        kind: "list",
        items: [
          "Correct pricing errors.",
          "Update prices without prior notice.",
          "Modify promotions at any time.",
        ],
      },
      { kind: "p", text: "Price changes do not affect orders that have already been confirmed." },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    chip: "Payments",
    kicker: "Payment",
    blocks: [
      {
        kind: "p",
        text: [
          "Payments are securely processed through ",
          { b: "WiPay" },
          " or other payment methods we may make available.",
        ],
      },
      { kind: "p", text: "SherryBerries does not store your debit or credit card information." },
      {
        kind: "p",
        text: "By submitting payment information, you confirm that you are authorized to use the selected payment method.",
      },
    ],
  },
  {
    id: "shipping-and-delivery",
    title: "Shipping and Delivery",
    chip: "Shipping",
    kicker: "Delivery",
    blocks: [
      {
        kind: "p",
        text: "Delivery times provided on the Website are estimates and may vary due to courier delays, weather conditions, customs, holidays, or circumstances beyond our control.",
      },
      {
        kind: "p",
        text: "Once an order has been handed over to the shipping provider, we are not responsible for delays caused by the carrier.",
      },
      {
        kind: "p",
        text: [
          "Additional shipping information is available in our ",
          { href: "/help/shipping", text: "Shipping Policy" },
          ".",
        ],
      },
    ],
  },
  {
    id: "returns-and-exchanges",
    title: "Returns and Exchanges",
    chip: "Returns",
    kicker: "Returns",
    blocks: [
      {
        kind: "p",
        text: [
          "Returns and exchanges are governed by our ",
          { href: "/help/returns", text: "Returns Policy" },
          ".",
        ],
      },
      {
        kind: "p",
        text: "For hygiene and safety reasons, certain body jewelry and pierced jewelry products may not be eligible for return unless they arrive damaged or defective.",
      },
      {
        kind: "p",
        text: "If your order arrives damaged or incorrect, please contact us as soon as possible so we can assist you.",
      },
    ],
  },
  {
    id: "product-information",
    title: "Product Information",
    chip: "Product info",
    kicker: "Accuracy",
    blocks: [
      {
        kind: "p",
        text: "We strive to ensure that product descriptions, photographs, prices, and availability are accurate.",
      },
      { kind: "p", text: "However, we do not guarantee that:" },
      {
        kind: "list",
        items: [
          "Product colors will appear exactly the same on every screen.",
          "Product descriptions are free from typographical errors.",
          "Inventory information is always current.",
        ],
      },
      { kind: "p", text: "We reserve the right to correct any errors without prior notice." },
    ],
  },
  {
    id: "jewelry-care",
    title: "Jewelry Care",
    chip: "Jewelry care",
    kicker: "Care & safety",
    blocks: [
      {
        kind: "p",
        text: "Customers are responsible for following all care instructions provided with purchased products.",
      },
      {
        kind: "p",
        text: "SherryBerries is not responsible for damage caused by improper use, misuse, failure to follow care instructions, allergic reactions to materials, or improper piercing aftercare.",
      },
      {
        kind: "p",
        text: "If you experience irritation, infection, or an allergic reaction, discontinue use immediately and consult a qualified healthcare professional.",
      },
    ],
  },
  {
    id: "customer-reviews",
    title: "Customer Reviews",
    chip: "Reviews",
    kicker: "Your content",
    blocks: [
      { kind: "p", text: "Customers may submit reviews, ratings, and other content." },
      {
        kind: "p",
        text: "By submitting content you grant SherryBerries a non-exclusive, royalty-free license to display, reproduce, and use that content for operating and promoting our Website.",
      },
      { kind: "p", text: "You agree not to submit content that:" },
      {
        kind: "list",
        items: [
          "Is false or misleading.",
          "Is defamatory or offensive.",
          "Infringes another person's rights.",
          "Contains spam or malicious software.",
        ],
      },
      { kind: "p", text: "We reserve the right to remove any content at our discretion." },
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    chip: "Acceptable use",
    kicker: "Conduct",
    blocks: [
      { kind: "p", text: "You agree not to:" },
      {
        kind: "list",
        items: [
          "Violate any applicable law.",
          "Attempt unauthorized access to the Website.",
          "Interfere with Website security.",
          "Upload malicious software.",
          "Use automated systems to scrape or overload the Website.",
          "Impersonate another person.",
          "Engage in fraudulent activity.",
        ],
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    chip: "IP",
    kicker: "Ownership",
    blocks: [
      { kind: "p", text: "All content on the Website, including but not limited to:" },
      {
        kind: "list",
        items: [
          "Logos",
          "Product photographs",
          "Graphics",
          "Website design",
          "Product descriptions",
          "Branding",
          "Text",
          "Images",
        ],
      },
      {
        kind: "p",
        text: "is owned by or licensed to SherryBerries and is protected by applicable intellectual property laws.",
      },
      {
        kind: "p",
        text: "You may not reproduce, copy, distribute, or use our content without prior written permission.",
      },
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    chip: "Liability",
    kicker: "Liability",
    blocks: [
      {
        kind: "p",
        text: "To the fullest extent permitted by law, SherryBerries shall not be liable for any indirect, incidental, consequential, special, or punitive damages arising from:",
      },
      {
        kind: "list",
        items: [
          "Use of the Website.",
          "Inability to use the Website.",
          "Product misuse.",
          "Delays in shipping.",
          "Third party services.",
          "Technical interruptions.",
          "Unauthorized access to your account.",
        ],
      },
      {
        kind: "p",
        text: "Our total liability for any claim relating to an order shall not exceed the amount paid for that order.",
      },
    ],
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    chip: "Disclaimer",
    kicker: "Warranties",
    blocks: [
      {
        kind: "p",
        text: 'The Website and all products and services are provided on an "AS IS" and "AS AVAILABLE" basis.',
      },
      {
        kind: "p",
        text: "Except where required by law, we make no warranties regarding uninterrupted access, availability, accuracy, or fitness for a particular purpose.",
      },
    ],
  },
  {
    id: "termination",
    title: "Termination",
    chip: "Termination",
    kicker: "Access",
    blocks: [
      {
        kind: "p",
        text: "We reserve the right to suspend or terminate your access to the Website without notice if you violate these Terms or engage in fraudulent, abusive, or unlawful activity.",
      },
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law",
    chip: "Governing law",
    kicker: "Jurisdiction",
    blocks: [
      {
        kind: "p",
        text: [
          "These Terms shall be governed by and interpreted in accordance with the laws of ",
          { b: "Trinidad and Tobago" },
          ", without regard to conflict of law principles.",
        ],
      },
      {
        kind: "p",
        text: "Nothing in these Terms limits any consumer rights that cannot legally be excluded.",
      },
    ],
  },
  {
    id: "changes-to-these-terms",
    title: "Changes to These Terms",
    chip: "Changes",
    kicker: "Updates",
    blocks: [
      { kind: "p", text: "We may update these Terms from time to time." },
      {
        kind: "p",
        text: 'Any updates will be posted on this page together with the revised "Last Updated" date.',
      },
      {
        kind: "p",
        text: "Your continued use of the Website after changes become effective constitutes acceptance of the updated Terms.",
      },
    ],
  },
];

export const TERMS_DOC: LegalDocument = {
  breadcrumb: "Terms of Service",
  eyebrow: "Legal · Sherry Berries Body Jewelry and Accessories",
  title: "Terms of",
  titleAccent: "service",
  lastUpdated: LAST_UPDATED,
  intro: INTRO,
  sections: SECTIONS,
  contact: {
    id: "contact-us",
    title: "Contact Us",
    chip: "Contact",
    kicker: "Get in touch",
    intro: "If you have questions regarding these Terms of Service, please contact us.",
    email: TERMS_EMAIL,
    website: SITE_URL,
  },
};
