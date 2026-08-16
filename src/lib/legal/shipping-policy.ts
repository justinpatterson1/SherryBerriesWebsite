// Editable content for the /help/shipping page — the Shipping Policy that the
// Terms of Service delegates to ("Additional shipping information is available
// in our Shipping Policy").
//
// Unlike privacy.ts and terms.ts, this copy was NOT supplied by the owner. It is
// derived from what the checkout actually implements, so it describes real
// behaviour rather than aspirational terms. The shipping methods, fees and ETAs
// below are generated from lib/checkout/shipping.ts — the same module the
// checkout API uses for authoritative totals — so a rate change in one place
// updates this page automatically and the two can never disagree.

import { SHIPPING, SHIPPING_ORDER } from "@/lib/checkout/shipping";
import type { Block, LegalDocument, Section } from "@/lib/legal/types";

export const LAST_UPDATED = "August 3, 2026";

export const SITE_URL = "https://www.sherryberries.com";
export const SUPPORT_EMAIL = "sherryvanessanichols@gmail.com";

/**
 * Owner-confirmed on 2026-08-15. Nothing in the codebase pins these down, so
 * they live here; each is used exactly once below, so editing here is enough.
 */
const OWNER_DECISIONS = {
  /** Time between a paid order and hand-off to the carrier. */
  processingTime: "1 to 2 business days",
  /** Cut-off after which an order is processed the next business day. */
  sameDayCutoff: "12:00 pm",
  /** How long to wait before a non-arriving parcel is treated as lost. */
  lostParcelWindow: "10 business days",
  /** Window to report a damaged or incomplete delivery. */
  damageReportWindow: "48 hours",
} as const;

const money = (n: number) => `$${n.toFixed(2)}`;

// Built from the checkout's own table so the published rates cannot drift from
// what a customer is actually charged.
const RATE_ITEMS = SHIPPING_ORDER.map((key) => {
  const option = SHIPPING[key];
  return [
    { b: option.label },
    ` — ${option.fee === 0 ? "Free" : money(option.fee)}. ${option.eta}.`,
  ];
});

const INTRO: Block[] = [
  {
    kind: "p",
    text: "This Shipping Policy explains where we deliver, what delivery costs, how long orders take, and what happens when a delivery goes wrong.",
  },
  {
    kind: "p",
    text: [
      "It forms part of our ",
      { href: "/terms", text: "Terms of Service" },
      ". For returns and exchanges, see our ",
      { href: "/help/returns", text: "Returns Policy" },
      ".",
    ],
  },
];

const SECTIONS: Section[] = [
  {
    id: "where-we-ship",
    title: "Where We Ship",
    chip: "Where we ship",
    kicker: "Coverage",
    blocks: [
      {
        kind: "p",
        text: "We currently deliver within Trinidad and Tobago only, and offer in-store collection in Curepe.",
      },
      {
        kind: "p",
        text: "We do not ship internationally at this time. If you are outside Trinidad and Tobago and would like to order, please contact us before placing an order so we can advise whether we can help.",
      },
    ],
  },
  {
    id: "shipping-options",
    title: "Shipping Options and Rates",
    chip: "Rates",
    kicker: "Options",
    blocks: [
      {
        kind: "p",
        text: [
          "All rates are shown in ",
          { b: "Trinidad and Tobago Dollars (TTD)" },
          " and are charged as a flat fee per order, regardless of how many items you buy:",
        ],
      },
      { kind: "list", items: RATE_ITEMS },
      {
        kind: "p",
        text: "You choose your delivery method at checkout, and the fee is shown in your order summary before you pay.",
      },
    ],
  },
  {
    id: "order-processing",
    title: "Order Processing",
    chip: "Processing",
    kicker: "Before dispatch",
    blocks: [
      {
        kind: "p",
        text: `Orders are prepared and handed to the carrier within ${OWNER_DECISIONS.processingTime} of payment being confirmed.`,
      },
      {
        kind: "p",
        text: `Orders placed after ${OWNER_DECISIONS.sameDayCutoff}, on weekends, or on public holidays are processed on the next business day.`,
      },
      {
        kind: "p",
        text: "Delivery estimates begin from dispatch, not from when the order was placed.",
      },
    ],
  },
  {
    id: "delivery-estimates",
    title: "Delivery Estimates",
    chip: "Estimates",
    kicker: "Timing",
    blocks: [
      {
        kind: "p",
        text: "Delivery times shown at checkout and on this page are estimates provided by our carriers, not guarantees.",
      },
      { kind: "p", text: "Estimates may be affected by:" },
      {
        kind: "list",
        items: [
          "Courier and postal delays.",
          "Weather conditions.",
          "Public holidays and peak periods.",
          "Incomplete or incorrect delivery details.",
          "Circumstances beyond our control.",
        ],
      },
    ],
  },
  {
    id: "delivery-address",
    title: "Delivery Address",
    chip: "Your address",
    kicker: "Accuracy",
    blocks: [
      {
        kind: "p",
        text: "You are responsible for providing a complete and accurate delivery address. Adding a nearby landmark helps our couriers considerably.",
      },
      {
        kind: "p",
        text: "If an order is returned to us because the address was incorrect or incomplete, or because nobody was available to receive it, the original shipping fee is not refundable and a further fee applies to send it again.",
      },
      {
        kind: "p",
        text: "If you spot a mistake in your address, contact us immediately. We can correct it only while the order has not yet been dispatched.",
      },
    ],
  },
  {
    id: "tracking-your-order",
    title: "Tracking Your Order",
    chip: "Tracking",
    kicker: "Progress",
    blocks: [
      {
        kind: "p",
        text: [
          "You can follow the progress of any order from ",
          { href: "/account?view=orders", text: "your account" },
          ", where each order moves through processing, dispatch, and delivery.",
        ],
      },
      {
        kind: "p",
        text: "Tracked courier deliveries include a tracking reference once the parcel has been collected.",
      },
    ],
  },
  {
    id: "delays-and-lost-parcels",
    title: "Delays and Lost Parcels",
    chip: "Delays",
    kicker: "Problems",
    blocks: [
      {
        kind: "p",
        text: "Once an order has been handed over to the shipping provider, we are not responsible for delays caused by the carrier — but we will always help you chase it.",
      },
      {
        kind: "p",
        text: `If your order has not arrived more than ${OWNER_DECISIONS.lostParcelWindow} past its estimated delivery date, contact us and we will open an enquiry with the carrier.`,
      },
      {
        kind: "p",
        text: "Where a parcel is confirmed lost in transit, we will replace the items or refund the order.",
      },
    ],
  },
  {
    id: "damaged-or-incomplete",
    title: "Damaged or Incomplete Deliveries",
    chip: "Damaged",
    kicker: "On arrival",
    blocks: [
      {
        kind: "p",
        text: "Please check your order as soon as it arrives.",
      },
      {
        kind: "p",
        text: [
          `If anything arrives damaged, incorrect, or missing, contact us within ${OWNER_DECISIONS.damageReportWindow} of delivery with photographs of the item and its packaging, and we will put it right at no cost to you. See our `,
          { href: "/help/returns", text: "Returns Policy" },
          " for how this is handled.",
        ],
      },
    ],
  },
  {
    id: "collection-in-store",
    title: "Collection in Store",
    chip: "Pickup",
    kicker: "Curepe",
    blocks: [
      {
        kind: "p",
        text: `Pickup orders are held for you in Curepe and are ready within 24 hours. We will let you know when your order is ready to collect.`,
      },
      {
        kind: "p",
        text: "Please bring your order number and a form of identification. If someone else is collecting on your behalf, let us know in advance.",
      },
    ],
  },
];

export const SHIPPING_POLICY_DOC: LegalDocument = {
  breadcrumb: "Shipping Policy",
  eyebrow: "Help · Sherry Berries Body Jewelry and Accessories",
  title: "Shipping",
  titleAccent: "policy",
  lastUpdated: LAST_UPDATED,
  intro: INTRO,
  sections: SECTIONS,
  contact: {
    id: "contact-us",
    title: "Questions About a Delivery?",
    chip: "Contact",
    kicker: "Get in touch",
    intro:
      "If you have a question about shipping, or an order that has not arrived when you expected it, please contact us and we will help.",
    email: SUPPORT_EMAIL,
    website: SITE_URL,
  },
};
