// Editable content for the /help/returns page — the Returns Policy that the
// Terms of Service delegates to ("Returns and exchanges are governed by our
// Returns Policy").
//
// Unlike privacy.ts and terms.ts, this copy was NOT supplied by the owner. It is
// written to match what the site actually does — eligibility follows the
// account area's rule that only delivered orders can open a request, and the
// reasons list is generated from RETURN_REASONS, the same list the request form
// renders — and to be consistent with the hygiene exclusion already stated in
// the Terms of Service.

import { RETURN_REASONS } from "@/lib/account/returns";
import type { Block, LegalDocument, Section } from "@/lib/legal/types";

export const LAST_UPDATED = "August 15, 2026";

export const SITE_URL = "https://www.sherryberries.com";
export const SUPPORT_EMAIL = "sherryvanessanichols@gmail.com";

/**
 * Owner-confirmed on 2026-08-15. Nothing in the codebase pins these down, so
 * they live here; each is used exactly once below, so editing here is enough.
 */
const OWNER_DECISIONS = {
  /** Days after delivery in which a return may be opened. */
  windowDays: 14,
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
    text: "Body jewelry is worn in a healing or healed piercing, so returns work a little differently here than for most products. This policy explains exactly what can and cannot be returned, and how to start a return.",
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
    id: "return-window",
    title: "Return Window",
    chip: "Window",
    kicker: "Timing",
    blocks: [
      {
        kind: "p",
        text: `You may request a return within ${OWNER_DECISIONS.windowDays} days of your order being delivered.`,
      },
      {
        kind: "p",
        text: "Requests made after that period cannot be accepted, except where an item is faulty and the fault could not reasonably have been discovered sooner.",
      },
    ],
  },
  {
    id: "not-eligible",
    title: "Items That Cannot Be Returned",
    chip: "Not eligible",
    kicker: "Hygiene",
    blocks: [
      {
        kind: "p",
        text: "For hygiene and safety reasons, we cannot accept returns on the following once they have been removed from their sealed packaging:",
      },
      {
        kind: "list",
        items: [
          "Body jewelry and pierced jewelry of any kind.",
          "Earrings and any item worn in a piercing.",
          "Aftercare products, sprays, and solutions.",
          "Items that have been worn, used, or inserted into a piercing.",
        ],
      },
      {
        kind: "p",
        text: "This is not a matter of preference — reselling jewelry that has been in contact with a piercing is a genuine infection risk, and we will not do it.",
      },
      {
        kind: "p",
        text: "This exclusion does not apply where an item arrives damaged, defective, or is not what you ordered. Those are always covered.",
      },
    ],
  },
  {
    id: "eligible-returns",
    title: "Items That Can Be Returned",
    chip: "Eligible",
    kicker: "Accepted",
    blocks: [
      { kind: "p", text: "We accept returns on:" },
      {
        kind: "list",
        items: [
          "Items that arrive damaged or defective.",
          "Items that are not what you ordered.",
          "Unopened items still sealed in their original packaging, within the return window.",
          "Merchandise and non-jewelry items in unused, resalable condition.",
        ],
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
        text: "We will replace the item or refund it in full, including any shipping you paid. You will not be asked to cover return postage, and the hygiene exclusion above does not apply.",
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
        text: `Where a return is because you changed your mind, return postage is paid by ${OWNER_DECISIONS.changeOfMindShipping}, and the original delivery fee is not refunded.`,
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
        text: "Because most of our jewelry cannot be returned once opened, we do not offer general exchanges — including exchanges for a different size, gauge, or style.",
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
