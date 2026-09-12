// Editable content for the /help/returns page — the Returns Policy that the
// Terms of Service delegates to ("Returns and exchanges are governed by our
// Returns Policy").
//
// Unlike privacy.ts and terms.ts, this copy was NOT supplied by the owner. It is
// written to match what the site actually does — eligibility follows the
// account area's rule that only delivered orders can open a request, and the
// reasons list is generated from RETURN_REASONS, the same list the request form
// renders.
//
// ⚠ Owner's rule, 2026-08-17: jewelry and aftercare are FINAL SALE once they
// leave the business. The previous version of this policy offered a 14-day
// window on sealed jewelry; that is gone. The window now applies only to
// merchandise and accessories — the categories isFinalSale() allows.
//
// The one thing this policy must never disclaim is our own mistake: an item
// that arrives damaged, defective, or is not what was ordered is always put
// right, final sale or not. Goods still have to be of merchantable quality and
// match their description under the Sale of Goods Act, and no published term
// changes that.

import { RETURN_REASONS, RETURN_WINDOW_DAYS } from "@/lib/account/returns";
import type { Block, LegalDocument, Section } from "@/lib/legal/types";
import { CANONICAL_ORIGIN } from "@/lib/seo/site-url";

export const LAST_UPDATED = "August 17, 2026";

// Re-exported from the SEO module rather than retyped: this value was a
// literal in each of the four legal files and had drifted to a domain the
// site does not serve. One source of truth now.
export const SITE_URL = CANONICAL_ORIGIN;
export const SUPPORT_EMAIL = "sherryvanessanichols@gmail.com";

/**
 * Owner-confirmed on 2026-08-15. Nothing in the codebase pins these down, so
 * they live here; each is used exactly once below, so editing here is enough.
 */
const OWNER_DECISIONS = {
  /** Days after delivery in which a return may be opened — merch/accessories only. */
  windowDays: RETURN_WINDOW_DAYS,
  /** How long a refund takes once the returned item has been inspected. */
  refundTime: "5 to 10 business days",
  /** Who pays return postage when the customer simply changed their mind. */
  changeOfMindShipping: "the customer",
  /** Whether a restocking fee applies. */
  restockingFee: "No restocking fee applies.",
} as const;

const INTRO: Block[] = [
  {
    kind: "p",
    text: "Body jewelry is worn in a healing or healed piercing, so returns work differently here than for most products. Jewelry and aftercare are sold as final sale: once an order has left us, those items cannot be returned or exchanged.",
  },
  {
    kind: "p",
    text: [
      { b: "This does not apply when something is our fault." },
      " If an item reaches you damaged, defective, or is not what you ordered, we will put it right — see below.",
    ],
  },
  {
    kind: "p",
    text: [
      "It forms part of our ",
      { href: "/terms", text: "Terms of Service" },
      ". For delivery times and rates, see our ",
      { href: "/help/shipping", text: "Shipping Policy" },
      ".",
    ],
  },
];

const SECTIONS: Section[] = [
  {
    id: "not-eligible",
    title: "Jewelry and Aftercare Are Final Sale",
    chip: "Final sale",
    kicker: "Hygiene",
    blocks: [
      {
        kind: "p",
        text: "Once an order has been collected or handed to a carrier, we cannot accept a return or exchange on:",
      },
      {
        kind: "list",
        items: [
          "Body jewelry and pierced jewelry of any kind.",
          "Earrings and any item worn in a piercing.",
          "Aftercare products, sprays, and solutions.",
        ],
      },
      {
        kind: "p",
        text: "This applies whether or not the packaging has been opened. Once these items are out of our hands we have no way to verify how they were stored or handled, and reselling jewelry that may have been in contact with a piercing is a genuine infection risk. It is not a matter of preference — we will not do it.",
      },
      {
        kind: "p",
        text: [
          { b: "Please choose carefully." },
          " We would much rather answer your questions before you order than have you stuck with a piece that is not right. Message us and we will help you get the size, gauge, and material right the first time.",
        ],
      },
      {
        kind: "p",
        text: "Final sale does not cover our mistakes. If an item arrives damaged, defective, or is not what you ordered, it is always put right — see below.",
      },
    ],
  },
  {
    id: "eligible-returns",
    title: "What Can Be Returned",
    chip: "Eligible",
    kicker: "Accepted",
    blocks: [
      { kind: "p", text: "We accept returns on:" },
      {
        kind: "list",
        items: [
          "Items that arrive damaged or defective — any item, always.",
          "Items that are not what you ordered — any item, always.",
          `Merchandise and accessories in unused, resalable condition, within ${OWNER_DECISIONS.windowDays} days of delivery.`,
        ],
      },
      {
        kind: "p",
        text: `Merchandise and accessories — apparel, cases, pouches, and similar non-jewelry items — carry no hygiene risk, so they keep a ${OWNER_DECISIONS.windowDays}-day window. Requests after that period cannot be accepted, except where an item is faulty and the fault could not reasonably have been discovered sooner.`,
      },
      {
        kind: "p",
        text: "Items must be returned with their original packaging and any included documentation.",
      },
    ],
  },
  {
    id: "how-to-request",
    title: "How to Request a Return",
    chip: "How to",
    kicker: "The process",
    blocks: [
      {
        kind: "p",
        text: [
          "Open a request from the Returns section of ",
          { href: "/account?view=returns", text: "your account" },
          ". You will be asked to choose the order, the item, and a reason.",
        ],
      },
      { kind: "p", text: "The reasons you can select are:" },
      { kind: "list", items: [...RETURN_REASONS] },
      {
        kind: "p",
        text: "Returns can only be opened against an order that has been delivered. Once submitted, your request is given a reference number and we will contact you with next steps — please do not send anything back before we have replied.",
      },
      {
        kind: "p",
        text: "Because jewelry and aftercare are final sale, a request on those items can only be about something arriving damaged, defective, or incorrect.",
      },
      {
        kind: "p",
        text: [
          "If you would rather not use your account, ",
          { href: "/contact", text: "contact us" },
          " with your order number and we will start the return for you.",
        ],
      },
    ],
  },
  {
    id: "damaged-or-incorrect",
    title: "Damaged, Defective, or Incorrect Items",
    chip: "Damaged",
    kicker: "Our mistake",
    blocks: [
      {
        kind: "p",
        text: "If your order arrives damaged, defective, or incorrect, contact us as soon as possible with photographs of the item and its packaging.",
      },
      {
        kind: "p",
        text: "We will replace the item or refund it in full, including any shipping you paid. You will not be asked to cover return postage.",
      },
      {
        kind: "p",
        text: [
          { b: "Final sale does not apply here." },
          " This covers jewelry and aftercare as much as anything else. Where we have sent you the wrong thing, or something that arrived broken or faulty, putting it right is our responsibility.",
        ],
      },
    ],
  },
  {
    id: "return-shipping",
    title: "Return Shipping Costs",
    chip: "Return postage",
    kicker: "Who pays",
    blocks: [
      {
        kind: "p",
        text: "Where an item is damaged, defective, or incorrect, we cover the cost of returning it.",
      },
      {
        kind: "p",
        text: `Where a merchandise or accessory return is because you changed your mind, return postage is paid by ${OWNER_DECISIONS.changeOfMindShipping}, and the original delivery fee is not refunded. Jewelry and aftercare cannot be returned for a change of mind at all.`,
      },
      { kind: "p", text: OWNER_DECISIONS.restockingFee },
    ],
  },
  {
    id: "refunds",
    title: "Refunds",
    chip: "Refunds",
    kicker: "Money back",
    blocks: [
      {
        kind: "p",
        text: "Once we have received and inspected the returned item, we will let you know whether the refund has been approved.",
      },
      {
        kind: "p",
        text: `Approved refunds are issued to the original payment method within ${OWNER_DECISIONS.refundTime}. How quickly it appears on your statement is up to your bank or card issuer.`,
      },
      {
        kind: "p",
        text: "Orders paid by cash on delivery are refunded by an alternative method agreed with you.",
      },
    ],
  },
  {
    id: "exchanges",
    title: "Exchanges",
    chip: "Exchanges",
    kicker: "Swaps",
    blocks: [
      {
        kind: "p",
        text: "Because jewelry and aftercare are final sale, we do not offer exchanges on them — including exchanges for a different size, gauge, or style.",
      },
      {
        kind: "p",
        text: [
          "If you are unsure of your size before ordering, please read our ",
          { href: "/learn/sizing", text: "sizing guide" },
          " or message us. We would much rather help you order the right piece than have you stuck with the wrong one.",
        ],
      },
      {
        kind: "p",
        text: "Where an item is faulty, we will exchange it for the same item wherever stock allows.",
      },
    ],
  },
  {
    id: "cancellations",
    title: "Cancelling an Order",
    chip: "Cancellations",
    kicker: "Before dispatch",
    blocks: [
      {
        kind: "p",
        text: "You may cancel an order for a full refund at any point before it has been dispatched. Contact us as soon as possible.",
      },
      {
        kind: "p",
        text: "Once an order has been handed to the carrier it can no longer be cancelled, and this policy applies instead.",
      },
    ],
  },
  {
    id: "allergies-and-reactions",
    title: "Allergies and Reactions",
    chip: "Reactions",
    kicker: "Sensitivity",
    blocks: [
      {
        kind: "p",
        text: "If you experience irritation, infection, or an allergic reaction, stop wearing the item immediately and consult a qualified healthcare professional.",
      },
      {
        kind: "p",
        text: [
          "A reaction to a material is not a fault in the item, so worn jewelry cannot be returned on those grounds. Our ",
          { href: "/learn/sizing", text: "sizing guide" },
          " sets out which materials are safe for fresh piercings — if you have known metal sensitivities, please ask us before ordering.",
        ],
      },
    ],
  },
];

export const RETURNS_POLICY_DOC: LegalDocument = {
  breadcrumb: "Returns Policy",
  eyebrow: "Help · Sherry Berries Body Jewelry and Accessories",
  title: "Returns",
  titleAccent: "policy",
  lastUpdated: LAST_UPDATED,
  intro: INTRO,
  sections: SECTIONS,
  contact: {
    id: "contact-us",
    title: "Need Help With a Return?",
    chip: "Contact",
    kicker: "Get in touch",
    intro:
      "If something has arrived damaged or incorrect, or you are not sure whether your item can be returned, please contact us and we will sort it out.",
    email: SUPPORT_EMAIL,
    website: SITE_URL,
  },
};
