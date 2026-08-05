# Open Issues

A running register of known problems that are **not** yet fixed, so they don't get
lost in `current-feature.md`'s History entries.

Every item below was **verified against the codebase on 2026-08-04** unless marked
otherwise. Grouped by severity, not by area.

**When you fix something:** delete the entry (git history keeps it) or move it to
the Resolved section at the bottom with a date.

---

## P1 — Published claims the site does not honour

These are the dangerous ones. Each is a promise made to a customer in the UI or in
a legal page that the code contradicts.

### 1. "Free shipping over $80" is advertised in four places and never applied

The checkout charges flat fees with **no threshold at all**.

- Advertised: [cart-client.tsx:282](../src/components/cart/cart-client.tsx#L282) ("✦ Free shipping over $80"), [trust-strip.tsx:32](../src/components/cart/trust-strip.tsx#L32), [products/[slug]/page.tsx:205](../src/app/products/%5Bslug%5D/page.tsx#L205), [product-trust-badges.tsx:33](../src/components/product/product-trust-badges.tsx#L33)
- Reality: [lib/checkout/shipping.ts](../src/lib/checkout/shipping.ts) — Pickup free / TTPost $25 / Courier $40, flat, always.

The published [Shipping Policy](../src/lib/legal/shipping-policy.ts) deliberately states the **flat rates**, because writing the $80 threshold into a policy page would commit the business to a discount the code refuses to give. **So the policy is correct and the marketing copy is wrong.**

**Fix:** either implement the threshold in `shipping.ts` (and let the policy generate it, as it already generates the rates), or delete those four claims. This is a pricing decision, not a code decision.

### 2. `/cart` and `/checkout` compute completely different totals

Not just a rounding difference — three independent divergences:

| | `/cart` | `/checkout` (authoritative) |
|---|---|---|
| Shipping | `$6`, free over `$80` ([cart-client.tsx:114](../src/components/cart/cart-client.tsx#L114)) | `$0` / `$25` / `$40`, no threshold |
| Tax | `8.75%` ([cart-client.tsx:115](../src/components/cart/cart-client.tsx#L115)) | none |
| Gift wrap | `$6`/line, localStorage only | not carried over |

A customer sees one grand total in the bag and a different one at checkout. The `$6` shipping figure and the `8.75%` tax rate **exist nowhere else in the codebase** — they appear to be template leftovers, and 8.75% is a US sales-tax rate, not a T&T one.

This was accepted as a trade-off when Checkout shipped, but it is now also inconsistent with a published Shipping Policy.

**Fix:** make `/cart` import [shipping.ts](../src/lib/checkout/shipping.ts) and drop the tax line, or show the bag as a subtotal-only summary with "shipping calculated at checkout".

### 3. The Returns and Shipping policies contain eight values I invented

`/help/returns` and `/help/shipping` copy was **not owner-supplied** (unlike `/privacy` and `/terms`). Rates, eligibility rules, and the reasons list are generated from real code, but these have no source of truth and are **my defaults, awaiting sign-off**:

- [returns-policy.ts](../src/lib/legal/returns-policy.ts) → `OWNER_DECISIONS`: return window **7 days**, refunds in **5–10 business days**, change-of-mind postage paid by **the customer**, **no restocking fee**.
- [shipping-policy.ts](../src/lib/legal/shipping-policy.ts) → `OWNER_DECISIONS`: processing **1–2 business days**, **12:00 pm** cut-off, **10 business days** before a parcel is treated as lost, **48 hours** to report damage.

Each is used exactly once, so confirming or changing one is a one-line edit.

**Fix:** owner confirms or corrects all eight.

### 4. Google Analytics is named in the Privacy Policy but is not integrated

[privacy.ts](../src/lib/legal/privacy.ts) names Google Analytics under Third Party Services and "Analytics providers" under Information Sharing. There is no `gtag`, no `googletagmanager`, no `@next/third-parties`, and no measurement-ID env var anywhere.

**Fix:** add GA or cut both mentions.

### 5. GDPR/cookie rights are asserted with no consent mechanism

The Privacy Policy describes cookie use and asserts EEA/GDPR rights, but there is **no cookie consent banner**. Consent-on-use is the weak position under GDPR.

**Fix:** decide whether a banner is in scope. If the business has no EEA customers, consider whether the GDPR section belongs at all.

### 6. Both legal pages license review content, but reviews cannot be submitted

The Terms grants SherryBerries a licence over customer-submitted reviews and the Privacy Policy warns that reviews are public. Neither is operative:

- No `POST /api/reviews` — **verified absent**.
- No submission form.
- The PDP reviews block is commented out at [products/[slug]/page.tsx:216](../src/app/products/%5Bslug%5D/page.tsx#L216).

The `Review` model exists and seeded reviews render, so this is aspirational rather than false — but nothing about it works today.

**Fix:** build the submission flow, or accept the clauses as forward-looking.

### 7. The Terms' hygiene exclusion contradicts the Returns UI

The Terms and the [Returns Policy](../src/lib/legal/returns-policy.ts) both say pierced/body jewelry cannot be returned once unsealed. The account area's Returns view lets a customer open a request against **any** delivered order, with no hygiene exclusion and no item-type check.

**Fix:** enforce the exclusion in the returns flow, or soften the policy. Currently the customer-facing form promises something the policy denies.

---

## P2 — Broken links and unset configuration

### 8. `/accessibility` is a dead footer link

[footer.tsx:89](../src/components/layout/footer.tsx#L89) links to `/accessibility`; the route does not exist. This is the **last remaining dead link** in the footer's legal row — `/privacy`, `/terms`, `/help/shipping` and `/help/returns` have all been filled.

**Fix:** write the page or comment the link out (the footer already has precedent for commented-out links at lines 13–14).

### 9. `/account/orders` is a dead footer link

[footer.tsx:22](../src/components/layout/footer.tsx#L22) links "Order Status" to `/account/orders`, which does not exist. The account area uses query params, not sub-routes.

**Fix:** change to `/account?view=orders` — the same href [shipping-policy.ts](../src/lib/legal/shipping-policy.ts) already uses.

### 10. Three footer category links point at slugs that don't exist

[footer.tsx:4-8](../src/components/layout/footer.tsx#L4) — seeded category slugs are `belly-rings`, `nose-rings`, `cartilage-jewelry`, `septum-jewelry`, `aftercare`, `merch`, `accessories`, `elixirs`.

| Footer link | Actual slug |
|---|---|
| `?category=tragus` | `cartilage-jewelry` |
| `?category=septum` | `septum-jewelry` |
| `?category=waistbeads` | *no such category* |

These render the empty-state card rather than 404-ing, so they look intentional. Predates the legal work — flagged when the PDP shipped and still unfixed.

**Fix:** correct the two slugs; either create a waistbeads category or drop the link.

### 11. `NEXT_PUBLIC_SITE_URL` is absent and `CONTACT_EMAIL` is empty

- `NEXT_PUBLIC_SITE_URL` — **not present in `.env` at all**. Checkout falls back to the request origin. All four legal pages now assert `https://www.sherryberries.com`.
- `CONTACT_EMAIL` — present but **blank** (`.env:16`).
- All four legal pages publish `sherryvanessanichols@gmail.com` as the contact address, which matches neither the blank `CONTACT_EMAIL` nor the Resend account owner that currently receives all outbound mail.

**Fix:** set both, and reconcile the three addresses so a privacy or returns request actually reaches a person. This is the item most likely to cause a real customer to be ignored.

### 12. Resend still uses the test sender

Until a domain is verified, Resend only delivers to the account owner. Order confirmations, verification emails, and password resets will not reach customers in production.

**Fix:** verify the sending domain and set `EMAIL_FROM` to an address on it.

---

## P3 — Brand and content inconsistencies

### 13. The site claims three different locations

The business is Trinidad & Tobago based (TTD pricing, T&T governing law, Curepe pickup), but:

- **Brooklyn & Bridgetown** — [footer.tsx:43,79](../src/components/layout/footer.tsx#L43), [brand-story.tsx:88](../src/components/home/brand-story.tsx#L88), [login/page.tsx:242](../src/app/login/page.tsx#L242)
- **Port of Spain** — [trust-strip.tsx:32](../src/components/cart/trust-strip.tsx#L32), [testimonials.ts:20](../src/lib/home/testimonials.ts#L20)
- **Curepe** — [shipping.ts:19](../src/lib/checkout/shipping.ts#L19), and now the Shipping Policy

Brooklyn and Bridgetown look like template leftovers. "Ships from Port of Spain" also contradicts the Curepe pickup point.

**Fix:** pick the real location and make every string agree.

### 14. Footer copyright says "SherryBerries Atelier"

[footer.tsx:78](../src/components/layout/footer.tsx#L78) — the legal name used everywhere else is "Sherry Berries Body Jewelry and Accessories".

### 15. Payment methods are advertised but not implemented

The footer shows **VISA / MC / AMEX / AFTERPAY** chips ([footer.tsx:63-66](../src/components/layout/footer.tsx#L63)) and `/cart` shows an Afterpay caption plus **Shop Pay** and **PayPal** express buttons — all non-functional stubs. Real payment paths are WiPay (card) and cash on delivery.

The Terms' "or other payment methods we may make available" covers this legally, but the advertising is misleading.

**Fix:** remove the chips and stubs for methods that don't work.

---

## P4 — Known limitations and code hygiene

### 16. Returns exist only in `sessionStorage`

The `/account` Returns view has no backing Prisma model. Requests are client state seeded with two demo entries on first visit, and are lost on a new session. A customer can "submit" a return that reaches nobody.

**Fix:** add a `ReturnRequest` model, or make the view a link to `/contact` until one exists. Given the Returns Policy now tells customers to use this flow, this is closer to P1 than it looks.

### 17. Orders carry no address snapshot

The `Order` schema has no address columns, so `/account` shows the customer's **current default address** as the ship-to for every historical order. Change your address and past orders appear to have shipped there.

Typed shipping details are snapshotted into `Order.notes` as a workaround.

**Fix:** add address columns (a migration) and read from them.

### 18. Delete-account is a mock

`/account` → Security shows a danger-zone confirm modal that fires a toast and redirects home. **No deletion happens.** The Privacy Policy tells customers they may request deletion.

**Fix:** implement the endpoint or replace the button with a contact route.

### 19. Changing email doesn't refresh the session

`PATCH /api/account/profile` updates the database, but the JWT keeps the old email and name until the next sign-in. No visible breakage today (the navbar shows neither), but it will surface as soon as anything renders the session email.

### 20. Saved-for-later and gift wrap are localStorage only

No `CartItem` schema change was made, so both are lost across devices and sessions. Gift wrap is charged in the `/cart` total (see issue 2) but never reaches the order.

### 21. Unused import causes the only lint warning

[products/[slug]/page.tsx:9](../src/app/products/%5Bslug%5D/page.tsx#L9) imports `ProductReviews`, used only on the commented-out line 216. It is the single warning in an otherwise clean `npm run lint`.

**Fix:** comment the import out alongside the usage, so lint is fully clean and the warning doesn't mask a new one.

### 22. Root layout puts `viewport` in the `metadata` export

Produces a build warning on every page that inherits it (`/privacy`, `/terms`, `/help/*`, `/cart`, `/wishlist`, `/verify-email`, `/reset-password`, `/checkout`). Harmless but noisy, and it trains you to ignore build warnings.

**Fix:** move it to the separate `viewport` export Next asks for.

### 23. No legal or policy page has been verified in a browser

`/privacy`, `/terms`, `/help/returns` and `/help/shipping` were verified by production-build server render, structural HTML checks, and a verbatim copy diff — **not** visually. The Playwright MCP server did not connect during either session.

Unverified: responsive breakpoints, light theme, and the **18 jump chips** on `/terms` wrapping (the densest chip row on the site).

**Fix:** one manual pass over the four pages at a narrow viewport and in light theme.

---

## Resolved

- **2026-08-03** — `/terms`, `/help/shipping` and `/help/returns` were dead footer links; all three now exist. The Terms' references to a non-existent Shipping Policy and Returns Policy are now working links.
- **2026-08-01** — `/privacy` was a dead footer link; page now exists.
- **2026-08-01** — The footer's Terms link had `href="\terms"` (a backslash, which would not route); corrected by the owner.
