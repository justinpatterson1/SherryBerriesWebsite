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

### 1. ~~"Free shipping over $80" advertised but never applied~~ — **RESOLVED 2026-08-06**, see Resolved section

### 1a. Other product-page and cart claims contradict the published policies

Removing the $80 claim left the surrounding copy in those same components, and it disagrees with the [Returns Policy](../src/lib/legal/returns-policy.ts) and [Shipping Policy](../src/lib/legal/shipping-policy.ts) published on 2026-08-03:

| Claim | Where | Published policy says |
|---|---|---|
| "14-day returns · **Free** returns on unworn pieces" | [trust-strip.tsx](../src/components/cart/trust-strip.tsx) | change-of-mind postage paid by the **customer** — returns are not free *(the 14 days is now correct)* |
| "returnable within 14 days for **store credit**" | [products/[slug]/page.tsx](../src/app/products/%5Bslug%5D/page.tsx) | refund to the **original payment method**, not store credit *(the 14 days is now correct)* |
| "Trinidad & Tobago delivery in **2–4 business days**" | [products/[slug]/page.tsx](../src/app/products/%5Bslug%5D/page.tsx) | TTPost **3–5**, courier **1–2** — 2–4 matches neither |

Same failure mode as issue 1: marketing copy written before the policies existed.

**Resolved rows:** the return *window* is settled — the owner chose **14 days** on 2026-08-15 (issue 3), which is what these badges already said, so [product-trust-badges.tsx](../src/components/product/product-trust-badges.tsx) needed no change and dropped off this table. The Afterpay row went with issue 15.

**Fix:** correct the "Free" returns claim and the "store credit" wording, and decide the real delivery estimate.

### 2. ~~`/cart` and `/checkout` compute completely different totals~~ — **RESOLVED 2026-08-07**, see Resolved section

### 3. ~~The Returns and Shipping policies contain eight values I invented~~ — **RESOLVED 2026-08-15**, see Resolved section

### 4. Google Analytics is named in the Privacy Policy but is not integrated

[privacy.ts](../src/lib/legal/privacy.ts) names Google Analytics under Third Party Services and "Analytics providers" under Information Sharing. There is no `gtag`, no `googletagmanager`, no `@next/third-parties`, and no measurement-ID env var anywhere.

**Fix:** add GA or cut both mentions.

### 5. GDPR/cookie rights are asserted with no consent mechanism

The Privacy Policy describes cookie use and asserts EEA/GDPR rights, but there is **no cookie consent banner**. Consent-on-use is the weak position under GDPR.

**Fix:** decide whether a banner is in scope. If the business has no EEA customers, consider whether the GDPR section belongs at all.

### 6. ~~Both legal pages license review content, but reviews cannot be submitted~~ — **RESOLVED 2026-08-16**, see Resolved section

### 6a. The homepage testimonials are placeholder copy presented as real reviews

[testimonials.ts](../src/lib/home/testimonials.ts) holds five 5-star quotes attributed to named customers in named T&T cities, with dates. Its own header note says: *"replace the placeholder copy below with the actual customer quotes."* They render as the homepage **Reviews** slider via [testimonials.tsx](../src/components/home/testimonials.tsx), star ratings and all.

This survived the 2026-08-16 review removal by the owner's explicit decision — the section stays and the **owner will supply real quotes**. Until then the homepage shows invented reviews with real-sounding attribution, which is the strongest remaining false claim on the site.

**Fix:** owner supplies genuine quotes; paste them into `TESTIMONIALS` and delete the placeholder note. No code change needed.

### 6b. The hero asserts a fabricated customer count

[hero.tsx:132](../src/components/home/hero.tsx#L132) — *"Trusted by 12,400+ sweet berries worldwide — and counting"* — beside four decorative gradient circles standing in for customer avatars. The number has no source. "worldwide" also contradicts the [Shipping Policy](../src/lib/legal/shipping-policy.ts), which says the business does not ship internationally.

Deliberately left in place on 2026-08-16 as out of scope for the reviews work; the adjacent "4.9 / 5 · 2,400+ reviews" tile *was* removed in that pass.

**Fix:** cut the tile, or replace the count with something true.

### 7. ~~The Terms' hygiene exclusion contradicts the Returns UI~~ — **RESOLVED 2026-08-15**, see Resolved section

---

## P2 — Broken links and unset configuration

### 8. ~~`/accessibility` is a dead footer link~~ — **RESOLVED**, see Resolved section

### 9. ~~`/account/orders` is a dead footer link~~ — **RESOLVED**, see Resolved section

### 10. ~~Three footer category links point at slugs that don't exist~~ — **RESOLVED 2026-08-06**, see Resolved section

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

### 13. ~~The site claims three different locations~~ — **RESOLVED 2026-08-06**, see Resolved section

### 14. ~~Footer copyright says "SherryBerries Atelier"~~ — **RESOLVED 2026-08-06**, see Resolved section

### 15. ~~Payment methods advertised but not implemented~~ — **RESOLVED 2026-08-06**, see Resolved section

---

## P4 — Known limitations and code hygiene

### 16. Returns still have no Prisma model

**Partly addressed.** The `sessionStorage` request form and its two fabricated demo entries are **gone** — the view now points the customer at `/contact`, so nothing pretends to be submitted any more *(this happened in the launch-prep pass; the register described the old form until 2026-08-15)*.

What remains is the underlying gap: there is **no `ReturnRequest` model**, so a return is an email thread with no record in the system and no status a customer can check.

**Fix:** add the model and rebuild the request flow on top of it. Lower urgency than it was — the UI is now honest about what it does.

### 17. Orders carry no address snapshot

The `Order` schema has no address columns, so `/account` shows the customer's **current default address** as the ship-to for every historical order. Change your address and past orders appear to have shipped there.

Typed shipping details are snapshotted into `Order.notes` as a workaround.

**Fix:** add address columns (a migration) and read from them.

### 18. Delete-account is a mock

`/account` → Security shows a danger-zone confirm modal that fires a toast and redirects home. **No deletion happens.** The Privacy Policy tells customers they may request deletion.

**Fix:** implement the endpoint or replace the button with a contact route.

### 19. Changing email doesn't refresh the session

`PATCH /api/account/profile` updates the database, but the JWT keeps the old email and name until the next sign-in. No visible breakage today (the navbar shows neither), but it will surface as soon as anything renders the session email.

### 20. Saved-for-later is localStorage only

No `CartItem` schema change was made, so the saved-for-later strip is lost across devices and sessions. (Gift wrap had the same problem and was **removed entirely** on 2026-08-07 — see Resolved.)

### 21. ~~Unused import causes the only lint warning~~ — **RESOLVED 2026-08-16**: the `ProductReviews` import and the component itself were deleted with issue 6. *(The "only lint warning" framing was already stale — lint now carries 28 pre-existing `jsx-a11y` warnings from the a11y baseline in `34ff95d`.)*

### 22. Root layout puts `viewport` in the `metadata` export

Produces a build warning on every page that inherits it (`/privacy`, `/terms`, `/help/*`, `/cart`, `/wishlist`, `/verify-email`, `/reset-password`, `/checkout`). Harmless but noisy, and it trains you to ignore build warnings.

**Fix:** move it to the separate `viewport` export Next asks for.

### 23. No legal or policy page has been verified in a browser

`/privacy`, `/terms`, `/help/returns` and `/help/shipping` were verified by production-build server render, structural HTML checks, and a verbatim copy diff — **not** visually. The Playwright MCP server did not connect during either session.

Unverified: responsive breakpoints, light theme, and the **18 jump chips** on `/terms` wrapping (the densest chip row on the site).

**Fix:** one manual pass over the four pages at a narrow viewport and in light theme.

---

## Resolved

- **2026-08-16** — *(was P1 issue 6)* **Reviews removed from the site; the legal clauses rewritten as forward-looking.** The owner chose removal over building a submission flow. The register framed this as a licence-clause problem, but the live problem was larger: **seeded faker reviews were driving star ratings and review counts across the storefront**, so every product card displayed social proof that no customer had given.
  - **Display removed** — star rows and counts deleted from [products/page.tsx](../src/app/products/page.tsx), [bestseller-card.tsx](../src/components/home/bestseller-card.tsx), [wish-card.tsx](../src/components/wishlist/wish-card.tsx) and [wish-recs.tsx](../src/components/wishlist/wish-recs.tsx), along with the four local `Stars` components. The two wishlist cards were the worst of it: they rendered `item.rating || 4.9` and `item.reviewCount || 264`, **fabricating "4.9 · 264" whenever the real data was zero**.
  - **Hero tile removed** — the floating "4.9 / 5 · 2,400+ reviews" chip and its now-unused `StarIcon` in [hero.tsx](../src/components/home/hero.tsx).
  - **Data layer cleaned** — `rating`/`reviewCount` dropped from `ProductListItem`, `BestsellerProduct`, `WishSnapshotItem` and `RecProduct`, and the four `reviews: { where: { approved: true } }` includes removed from [product.ts](../src/lib/queries/product.ts), [home.ts](../src/lib/queries/home.ts) and [snapshot/route.ts](../src/app/api/wishlist/snapshot/route.ts). The PDP no longer fetches review rows at all.
  - **Deleted** — `src/components/product/product-reviews.tsx` and the commented-out PDP block and import.
  - **Legal copy softened** — the Terms' "Customers may submit reviews, ratings, and other content" became an explicit *"We do not currently accept…"* with the licence recast conditionally, and the Privacy Policy's review section likewise. **The clauses were kept, not deleted**, so they are already in place if reviews ship later. `LAST_UPDATED` bumped to **August 16, 2026** on both.

  **The `Review` model, its seed block, and the admin surface were left alone** — the schema is untouched so the feature can return without a migration. Note there is **no admin moderation UI** for reviews, which is why building submission was not attempted: `Review.approved` defaults to `false`, so submissions would have queued somewhere nobody can see.

  **Still open, both by the owner's decision:** the homepage testimonials slider (**new issue 6a**) and the hero's "12,400+" customer count (**new issue 6b**).

  **Verification:** zero occurrences of `★`, `out of 5 stars`, `reviewCount` or `.rating` anywhere in `src` outside `src/generated` and two unrelated hits (the account tier badge, and testimonials). Typecheck, `npm test` 20/20, lint (28 pre-existing warnings, unchanged) and production build all clean. **Not visually verified** — the homepage, `/products`, PDP and `/wishlist` cards all lost a row and should be eyeballed for spacing.
- **2026-08-15** — *(register correction; no code changed today)* **P2 issues 8 and 9 were both already fixed** — in commit `f013afd`, "chore: comment out dead footer links", which the register was never updated to reflect.
  - *(was issue 8)* The `/accessibility` link is **commented out** at [footer.tsx:82–84](../src/components/layout/footer.tsx#L82-L84), with a note giving the reason: publishing a conformance statement while known WCAG issues are open would be a claim the site can't back. The footer's legal row is now Privacy and Terms only.
  - *(was issue 9)* "Order Status" already points at **`/account?view=orders`** — [footer.tsx:22](../src/components/layout/footer.tsx#L22) — matching the href [shipping-policy.ts](../src/lib/legal/shipping-policy.ts) uses.

  **Verified:** zero live references to `/accessibility` or `/account/orders` anywhere in `src`.
- **2026-08-15** — *(was P1 issue 7)* **The hygiene exclusion is now visible in the account Returns view.** The register described a request form that no longer exists — the `sessionStorage` form went in the launch-prep pass — but the contradiction survived it: the view still listed every delivered order under **"Orders you can return"**, item names and all, while the Terms and the [Returns Policy](../src/lib/legal/returns-policy.ts) say pierced jewelry and aftercare cannot come back once unsealed. A customer reading that heading was being told the opposite of the policy.
  - **New classifier** — `isHygieneExcluded(categorySlug)` in [returns.ts](../src/lib/account/returns.ts). It is an **allowlist**: only `accessories` and `merch` are resalable, so a category added later is treated as excluded rather than silently promising a refund. `Product.jewelryType` was *not* usable for this — the seed files both `accessories` and `merch` under the `AFTERCARE` catch-all, which would have marked a tote bag as hygiene-excluded.
  - **Threaded through the query** — [account.ts](../src/lib/queries/account.ts) now selects `product.category.slug` and exposes `hygieneExcluded` on `AccountOrderItem`.
  - **View rewritten** — [returns-view.tsx](../src/components/account/returns-view.tsx): heading "Orders you can return" → **"Your delivered orders"**; the items line became a per-item list where each item carries **"Sealed & unopened only"** or **"Returnable if unused"**; and a lead-in states the exclusion with the damaged/defective/incorrect carve-out called out in full, since that carve-out is what stops the badges from over-promising in the other direction.

  **This is advisory, not a gate** — deliberately. There is no submission flow left to gate (see issue 16); a human decides at `/contact`, and the classifier cannot know whether a package was opened. The point is that the customer is no longer told something the policy denies.

  **Verification:** new [returns.test.ts](../src/lib/account/returns.test.ts) covers all eight seeded categories plus the unknown-slug default; typecheck, `npm test` **20/20** and production build all clean, lint unchanged at 28 pre-existing a11y warnings. **Not visually verified** — `/account` needs a signed-in session with a delivered order.
- **2026-08-15** — *(was P1 issue 3)* **All eight invented policy values signed off by the owner.** Seven were confirmed as written; one changed:
  - **Return window 7 → 14 days** — [returns-policy.ts](../src/lib/legal/returns-policy.ts) `OWNER_DECISIONS.windowDays`. The owner chose the *more generous* option deliberately, because the product-page and cart badges already advertised 14 days and a customer could reasonably have relied on them. This means **no UI change was needed** — the badges were right and the policy was wrong, not the other way round.
  - **Confirmed unchanged:** refunds in **5–10 business days**; change-of-mind postage paid by **the customer** with **no restocking fee**; processing **1–2 business days** with a **12:00 pm** cut-off; **10 business days** past the estimate before a parcel is chased as lost; **48 hours** to report damage.

  The `⚠ OWNER SIGN-OFF NEEDED` banners and the "awaiting confirmation" JSDoc were removed from both [returns-policy.ts](../src/lib/legal/returns-policy.ts) and [shipping-policy.ts](../src/lib/legal/shipping-policy.ts) and replaced with a dated confirmation note; the `OWNER_DECISIONS` blocks themselves stay, since these values still have no other source of truth. `LAST_UPDATED` on the Returns Policy moved to **August 15, 2026** (the Shipping Policy's date is unchanged — its content did not).

  **Verification:** typecheck, `npm test` 15/15 and production build all clean; `/help/returns` and `/help/shipping` both prerender. Lint is unchanged at 28 pre-existing a11y warnings. **Not visually verified** — see issue 23, which still stands.
- **2026-08-07** — *(was P1 issue 2)* **`/cart` no longer invents its own totals.** The bag is now a **subtotal-only summary** and shipping is quoted at checkout, where the delivery method is actually chosen. Owner's decisions: nothing is free over $80, there is no inclusive tax, shipping is conceptually only for orders outside T&T, and gift wrap goes away.
  - **Free-shipping threshold deleted** — `FREE_SHIP_THRESHOLD` and the `taxable >= 80 ? 0 : 6` line are gone from [cart-client.tsx](../src/components/cart/cart-client.tsx). The `$6` figure existed nowhere else in the codebase.
  - **Tax removed but preserved as a comment**, per the owner's request, so it can be reinstated if T&T VAT ever applies. The 8.75% rate was a US sales-tax leftover.
  - **Gift wrap removed entirely** — the `$6`/line charge, the `★ Gift` image badge, the "Add gift wrap (+$6)" row action, the `giftWrap`/`onToggleGiftWrap` props on [cart-row.tsx](../src/components/cart/cart-row.tsx), the `gifts` state and `toggleGift` handler, the summary row, and `readGiftWraps`/`writeGiftWraps` plus the `sb-cart-gift` key in [local-extras.ts](../src/lib/cart/local-extras.ts). *(Note: any `sb-cart-gift` entry already in a returning customer's localStorage is now simply ignored — harmless orphan.)*
  - **Shipping row now reads "Calculated at checkout"** instead of a fabricated amount, and the `Totals` type narrowed from 8 fields to 4 (`subtotal`, `discount`, `total`, `itemCount`).

  The bag total is now exactly `subtotal − discount`, so **cart total + the method fee chosen at checkout = the checkout total** — the two pages finally agree. No change was made to [shipping.ts](../src/lib/checkout/shipping.ts) or the published Shipping Policy, so T&T delivery still costs what it did.

  **Why the literal rule wasn't implemented:** "shipping only outside T&T" is not currently representable — the checkout form collects name, email, phone, address, city and landmark but **no country**, so every order is implicitly domestic. Charging by geography would need a country field through the form, validation, checkout API and order snapshot, and the Shipping Policy currently states the business does not ship internationally at all. Deferred rather than guessed.

  **Verification:** zero occurrences of gift wrap, `FREE_SHIP`, `0.0875`, `taxable` or "Estimated tax" anywhere in `src`; typecheck, lint, `npm test` 15/15 and production build all clean; `/cart` returns 200. **The totals block itself was not visually verified** — `OrderSummary` only renders once the client has a hydrated, non-empty cart, so a server-render check shows the empty state instead. Confirming the rendered rows needs a signed-in session with items in the bag.
- **2026-08-06** — *(was P3 issue 13)* **Brooklyn & Bridgetown removed; the site now says Trinidad & Tobago.** [footer.tsx](../src/components/layout/footer.tsx) tagline ("made with love in Trinidad & Tobago") and copyright ("in Trinidad & Tobago"), and [brand-story.tsx](../src/components/home/brand-story.tsx)'s founder line ("Brooklyn · Bridgetown" → "Trinidad & Tobago"). The login page's testimonial attribution ("— Maya, Brooklyn") became **"— Maya, Port of Spain"** rather than "Trinidad & Tobago", since a customer quote needs a city, matching the convention already used in [testimonials.ts](../src/lib/home/testimonials.ts). The one genuinely wrong Port of Spain claim — "ships from Port of Spain", which contradicted the Curepe pickup point — was already deleted with the free-shipping tile. Remaining Port of Spain strings are customer locations, not business-location claims. Verified: zero occurrences of Brooklyn or Bridgetown anywhere in `src`.
- **2026-08-06** — *(was P3 issue 14)* **Footer copyright changed** from "© 2026 SherryBerries Atelier" to **"© 2026 SherryBerries"**. No "Atelier" remains in `src`.
- **2026-08-06** — *(was P3 issue 15)* **Every unimplemented payment method removed from the UI.** Done in two passes:
  - Footer VISA / MC / AMEX / AFTERPAY chip row, plus its now-unused `PayChip` component — [footer.tsx](../src/components/layout/footer.tsx).
  - "Pay in 4 with Afterpay" from the homepage hero marquee (5 → 3 items, since the free-shipping item also went) — [hero.tsx](../src/components/home/hero.tsx).
  - "Pay in 4 · Interest-free with Afterpay" tile from the cart trust strip — [trust-strip.tsx](../src/components/cart/trust-strip.tsx). The strip is now **2 tiles**, so its grid went `grid-cols-3` → `grid-cols-2` with the breakpoint moved from `max-[900px]:grid-cols-2` to `max-[560px]:grid-cols-1`.
  - The "or 4 interest-free payments … with Afterpay" caption under the total, and the entire **express checkout** block — the divider plus the **Shop Pay** and **PayPal** buttons that toasted *"is a visual stub for v1"* — from [order-summary.tsx](../src/components/cart/order-summary.tsx). The `onError` prop stays; it is still used by the promo-code path.

  The only payment methods now shown anywhere are the real ones: WiPay card and cash on delivery. Verified: zero occurrences of `Afterpay`, `Shop Pay`, `PayPal`, `Pay in 4`, `interest-free` or `express checkout` in `src` or in the rendered `/` and `/cart`.
- **2026-08-06** — *(was P2 issue 10)* **All three broken footer category links fixed** in [footer.tsx](../src/components/layout/footer.tsx): `?category=tragus` → `cartilage-jewelry`, `?category=septum` → `septum-jewelry`, and **"Waistbeads" relabelled "Merchandise"** → `?category=merch` (matching the navbar's existing Merchandise link, since no waistbeads category exists or was planned). Verified against the running build — all five Shop links plus Aftercare now return real products, where `cartilage-jewelry` (11), `septum-jewelry` (10) and `merch` (6) previously all rendered the empty-state card. No stale slugs remain anywhere in `src`.
- **2026-08-06** — *(was P1 issue 1)* **"Free shipping over $80" removed from the UI.** The threshold was never implemented in checkout, so the claim was deleted rather than honoured. Removed from **five** places — the register originally said four; [hero.tsx](../src/components/home/hero.tsx)'s marquee was missed on the first sweep:
  - [hero.tsx](../src/components/home/hero.tsx) — dropped from the homepage marquee (5 → 4 items).
  - [cart-client.tsx](../src/components/cart/cart-client.tsx) — deleted the whole three-state bag header line ("Free shipping over $80" / "$X from free shipping" / "You unlocked free shipping") and the `remainingForFreeShip` calculation; the header is now just the "Your bag." heading.
  - [trust-strip.tsx](../src/components/cart/trust-strip.tsx) — removed the "Free shipping" tile; grid went `grid-cols-4` → `grid-cols-3` so the row has no hole.
  - [product-trust-badges.tsx](../src/components/product/product-trust-badges.tsx) — removed the "Free shipping" badge; the `auto-fit` grid absorbs it (3 → 2 badges).
  - [products/[slug]/page.tsx](../src/app/products/%5Bslug%5D/page.tsx) — dropped the leading sentence from the Shipping & returns accordion.

  **⚠ The threshold still exists in `/cart`'s totals** — [cart-client.tsx:114](../src/components/cart/cart-client.tsx#L114) still zeroes shipping at `>= $80`. It is no longer *advertised*, but the bag still silently discounts. That belongs to **issue 2** and was deliberately left alone, since changing it changes displayed totals. Verified: no "free shipping" or "$80" text remains in the rendered `/`, `/cart`, or PDP output; typecheck, lint, `npm test` 15/15, and production build all clean.
- **2026-08-03** — `/terms`, `/help/shipping` and `/help/returns` were dead footer links; all three now exist. The Terms' references to a non-existent Shipping Policy and Returns Policy are now working links.
- **2026-08-01** — `/privacy` was a dead footer link; page now exists.
- **2026-08-01** — The footer's Terms link had `href="\terms"` (a backslash, which would not route); corrected by the owner.
