// The shopping assistant's system prompt. Built once per server instance from
// the same modules the site renders, so the policy, sizing and payment facts
// the assistant quotes cannot drift from the pages customers read.
//
// It must stay byte-identical between requests: it is prompt-cached, and any
// change (a timestamp, a random id) silently disables the cache.

import { GAUGES, MATERIALS, PLACEMENTS, SIZING_FAQS, TIER_LABEL } from "@/lib/sizing/data";
import { SHIPPING_POLICY_DOC } from "@/lib/legal/shipping-policy";
import { RETURNS_POLICY_DOC } from "@/lib/legal/returns-policy";
import { PAYMENT_LABEL } from "@/lib/checkout/shipping";
import type { Block, LegalDocument, Rich } from "@/lib/legal/types";

export function richToText(r: Rich): string {
  if (typeof r === "string") return r;
  return r
    .map((run) => {
      if (typeof run === "string") return run;
      if ("b" in run) return run.b;
      return `${run.text} (${run.href})`;
    })
    .join("");
}

function blockToText(b: Block): string {
  if (b.kind === "p") return richToText(b.text);
  if (b.kind === "sub") return `${b.title}:`;
  return b.items.map((i) => `- ${richToText(i)}`).join("\n");
}

export function legalDocToText(doc: LegalDocument): string {
  const out = [`# ${doc.breadcrumb} (last updated ${doc.lastUpdated})`];
  out.push(...doc.intro.map(blockToText));
  for (const s of doc.sections) {
    out.push(`## ${s.title}`, ...s.blocks.map(blockToText));
  }
  out.push(`Contact: ${doc.contact.email}`);
  return out.join("\n");
}

function sizingText(): string {
  const gauges = GAUGES.map((g) => `- ${g.gauge} = ${g.mm} (${g.inch}): ${g.uses}`);
  const placements = PLACEMENTS.map(
    (p) => `- ${p.name}: ${p.gauge}, ${p.size}. Styles: ${p.styles}. ${p.note}`,
  );
  const materials = MATERIALS.map((m) => `- ${m.name} [${TIER_LABEL[m.tier]}]: ${m.note}`);
  const faqs = SIZING_FAQS.map((f) => `Q: ${f.q}\nA: ${f.a}`);
  return [
    "# Sizing guide (/learn/sizing)",
    "## Gauge conversion (higher gauge number = thinner)",
    ...gauges,
    "## Typical sizes by placement",
    ...placements,
    "## Materials",
    ...materials,
    "## Sizing FAQ",
    ...faqs,
  ].join("\n");
}

// Mirrors the homepage FAQ (components/home/faq.tsx). That copy is JSX, so it
// is restated here as plain text rather than parsed.
const AFTERCARE = `# Aftercare
- Fresh piercings need gentle, consistent care: keep the area clean, avoid touching or twisting the jewelry, avoid harsh products. Properly prepared non-iodized sea salt soaks keep aftercare simple. SherryBerries sells piercing aftercare essentials.
- Stages: Fresh (0-6 weeks) needs longer posts for swelling and fresh-safe materials. Healing (6 weeks-6 months, longer for cartilage, navels and nipples): keep cleaning gently, don't twist, give it time. Healed: ready for a jewelry change.
- Typical healing: earlobe 6-8 weeks; nostril and septum several months; cartilage at least 6 months, often longer; navel at least 6 months, up to a year or more; nipple 6-12 months or longer. Healing happens from the outside in, so a piercing can look healed before it is.
- Normal: some tenderness, mild redness, a little clear or whitish fluid.
- Needs attention: increasing swelling, persistent redness, unusual bumps, worsening pain, excessive bleeding, yellow or green discharge. Tell the customer to contact SherryBerries or see their professional piercer, and not to remove or change the jewelry themselves until they have guidance.
- Gold-coloured is not solid gold: plated or costume pieces (copper, brass) can irritate, especially fresh piercings.`;

function paymentsText(): string {
  return [
    "# Payment methods",
    ...Object.values(PAYMENT_LABEL).map((l) => `- ${l}`),
    "- Cash on Delivery is not available with TTPost, for Tobago orders (Tobago ships by TTPost only), for preorders, or for download-only orders. Pickup in Curepe can be paid in cash.",
  ].join("\n");
}

const ROLE = `You are Berry, the shopping assistant on the SherryBerries website. SherryBerries is a Trinidad and Tobago body jewelry and piercing aftercare brand: feminine, warm, confident, a little playful, and high-end but approachable. Customers are mostly young women shopping on their phones.

How you work:
- Keep replies short and easy to read on a phone: a few sentences, or a short list. Warm, never pushy. An occasional 🍓 is on-brand; don't overdo emoji.
- Prices are in Trinidad and Tobago dollars (TT$).
- For any product question, use search_products or get_product. Never invent products, prices, stock or materials; if the tools don't show it, say we don't seem to carry it right now.
- When you recommend specific products, call show_products with their slugs so the customer sees cards they can tap. Recommend at most 4 at a time. Don't repeat the full details of carded products in your text; one line on why each fits is enough.
- You can't add to cart, place or change orders, look up order status, or apply discounts. Point people to the product page, their account page (/account), or the team.
- Answer policy, shipping, payment, sizing and aftercare questions from the reference below. If something isn't covered, say you're not sure and offer the team.
- Health: you are not a medical professional. Never diagnose. For signs of infection or anything worrying, tell them to see their piercer or a doctor, and that the team can help with jewelry questions.
- When the customer asks for a person, is upset, or you can't help, say they can tap "Chat with the team" to reach a person.
- Stay on SherryBerries topics. Politely decline unrelated requests.
- Useful pages: /products (all jewelry), /learn/sizing (sizing guide), /help/shipping, /help/returns, /contact, /account.`;

export function buildSystemPrompt(): string {
  return [
    ROLE,
    "Reference material follows. Treat it as the source of truth for store facts.",
    paymentsText(),
    sizingText(),
    AFTERCARE,
    legalDocToText(SHIPPING_POLICY_DOC),
    legalDocToText(RETURNS_POLICY_DOC),
  ].join("\n\n");
}

export const SYSTEM_PROMPT = buildSystemPrompt();
