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

### 1a. ~~Other product-page and cart claims contradict the published policies~~ — **RESOLVED 2026-08-17**, see Resolved section

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

### 6b. ~~The hero asserts a fabricated customer count~~ — **RESOLVED 2026-08-17**, see Resolved section

### 6c. ~~Two membership perks are advertised but not implemented~~ — **RESOLVED 2026-08-17**, see Resolved section

### 7. ~~The Terms' hygiene exclusion contradicts the Returns UI~~ — **RESOLVED 2026-08-15**, see Resolved section

---

## P1s — Security gaps found in the 2026-09-04 pre-launch audit

Audited against the owner's 28-point checklist. **Already solid, not repeated below:** SQL injection (Prisma only, zero raw queries), XSS (zero `dangerouslySetInnerHTML`), bcrypt hashing, authorization (every `/api/admin/*` route calls `requireAdmin()`, role read fresh from the DB), server-side validation, error handling that leaks nothing, secret management, and WiPay hash verification (a `success` with a bad hash leaves the order **PENDING**).

### S1. No security headers, and no Content Security Policy

[next.config.ts](../next.config.ts) sets none, there is no middleware, and no `vercel.json`. Missing **HSTS**, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, and any CSP.

**Fix:** a `headers()` block in the Next config. Cheapest item on the whole list.

### S2. Admin logs in exactly like a customer

Same form, same session policy, no 2FA, no IP restriction. One reused password on one admin account is full store compromise — pricing, orders, customer data.

**Fix:** 2FA on admin accounts, or at minimum a shorter admin session and a login alert.

### S3. ~~No audit log of admin activity~~ — **RESOLVED 2026-09-05**, see Resolved section

### S4. No bot protection, monitoring, dependency scanning, or security testing

- **Bot protection:** none on register, contact, or newsletter. The newsletter table is publicly writable.
- **Monitoring:** 6 `console.error` calls and nothing else. No Sentry, no alerting — you will not know when something breaks.
- **Dependency scanning:** no CI at all (`.github/workflows` absent). `npm audit` could not run on 2026-09-04 (registry returned 503), so the current vulnerability state is **unknown**.
- **Security testing:** none. (Not to be confused with issue 23, which covered *visual* verification of the legal pages and was resolved 2026-08-19 — no security testing of any kind has been done.)

### S5. Rate limiting fails open, silently

By design in [rate-limit.ts](../src/lib/rate-limit.ts): no Upstash credentials, or Redis unreachable, means every request is allowed so an outage cannot lock people out of signing in. The consequence is that **if `UPSTASH_*` is unset in production there is no rate limiting anywhere and nothing reports it**. Set locally as of 2026-09-04; unverified in production.

**Fix:** confirm the production environment has both `UPSTASH_*` values, and consider logging loudly at boot when the limiter is disabled.

### S6. Smaller items

- **CSRF:** NextAuth covers its own routes and SameSite=Lax blocks the obvious cases, but custom mutating routes have no Origin check.
- **Uploads:** admin-only, 5 MB cap, random UUID names, off-origin in R2 — but [r2.ts](../src/lib/storage/r2.ts) trusts the *client-declared* content type with no magic-byte check.
- **Backups:** nothing in the repo; depends on the Neon plan's PITR. Verify in their console.

---

## P2 — Broken links and unset configuration

### 8. ~~`/accessibility` is a dead footer link~~ — **RESOLVED**, see Resolved section

### 9. ~~`/account/orders` is a dead footer link~~ — **RESOLVED**, see Resolved section

### 10. ~~Three footer category links point at slugs that don't exist~~ — **RESOLVED 2026-08-06**, see Resolved section

### 11. `NEXT_PUBLIC_SITE_URL` is absent and `CONTACT_EMAIL` is empty

- `NEXT_PUBLIC_SITE_URL` — **still not present in `.env`**, though this is now cosmetic locally: [site-url.ts](../src/lib/seo/site-url.ts) falls back to `CANONICAL_ORIGIN` (`https://shopsherryberries.com`). Checkout and the admin payments route still fall back to the request origin instead. Set it in Vercel.
- `CONTACT_EMAIL` — **now set** (34 chars, verified 2026-09-12).
- ~~All four legal pages assert `https://www.sherryberries.com`~~ — **RESOLVED 2026-09-12**: all four now import `CANONICAL_ORIGIN` from [site-url.ts](../src/lib/seo/site-url.ts) instead of holding their own literal, so the domain cannot drift out of step again.
- **Still open:** all four legal pages publish `sherryvanessanichols@gmail.com` as the contact address, which matches neither `CONTACT_EMAIL` nor the `EMAIL_FROM` sender (`support@shopsherryberries.com`). A customer sending a privacy or returns request has three addresses to choose from and only one of them is monitored as the store's own.

**Fix:** set `NEXT_PUBLIC_SITE_URL` in Vercel, and reconcile the contact addresses.

### 12. ~~Resend still uses the test sender~~ — **RESOLVED 2026-09-12**

The owner confirmed the sending domain is verified in Resend and mail is being delivered. `EMAIL_FROM` is `SherryBerries <support@shopsherryberries.com>` — an address on the verified domain, not `onboarding@resend.dev`. The original entry was written when it was still the test sender.

**Carried forward into #25:** the reason this mattered for the newsletter was bounce rate. A verified domain has a reputation to lose, so the 199 fake `@berrymail.test` rows are now *more* urgent to purge before a first campaign, not less.

---

## P3 — Brand and content inconsistencies

### 13. ~~The site claims three different locations~~ — **RESOLVED 2026-08-06**, see Resolved section

### 14. ~~Footer copyright says "SherryBerries Atelier"~~ — **RESOLVED 2026-08-06**, see Resolved section

### 15. ~~Payment methods advertised but not implemented~~ — **RESOLVED 2026-08-06**, see Resolved section

---

## P4 — Known limitations and code hygiene

### 16. ~~Returns still have no Prisma model~~ — **RESOLVED 2026-08-18**, see Resolved section

### 17. ~~Orders carry no address snapshot~~ — **RESOLVED 2026-08-19**, see Resolved section

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

### 24. ~~The newsletter signup does nothing~~ — **RESOLVED 2026-08-18**, see Resolved section

### 25. ~~⚠ The subscriber list contains 200 fake seeded addresses~~ — **RESOLVED 2026-09-12**, see Resolved section

### 23. ~~No legal or policy page has been verified in a browser~~ — **RESOLVED 2026-08-19**, see Resolved section

### 26. The public site's light theme resets on every navigation

[navbar.tsx:66](../src/components/layout/navbar.tsx#L66) holds the theme in `useState<Theme>("dark")` and writes it to `<html data-theme>` — but it **never reads or writes `localStorage`**. So the navbar's toggle works on the page you are looking at and is forgotten the moment you navigate or reload.

The admin area, by contrast, *does* persist to `localStorage["sb-theme"]` ([admin-client.tsx:32](../src/components/admin/admin-client.tsx#L32)). **Both use the same key**, so an admin who picks light in `/admin` still gets dark everywhere else — the public site ignores the stored value entirely.

Found while verifying issue 23: `localStorage` held `light` while the page rendered `dark`. The `light:` Tailwind variants throughout the codebase are therefore near-unreachable in normal use, despite being carefully maintained (they render correctly when forced — see the Resolved entry).

**Fix:** read `sb-theme` on mount in the navbar and write on toggle, matching the admin. Note the naive version causes a hydration mismatch — the server cannot know the stored value, so it needs the usual inline-script-before-paint or a `suppressHydrationWarning` pass.

---

## Resolved

- **2026-09-12** — *(was issue 25)* **The 199 fake seeded addresses are out of the production newsletter table.** Purged with [scripts/newsletter-purge-seed.ts](../scripts/newsletter-purge-seed.ts), which writes every matched row to a dated JSON backup before deleting (gitignored). Verified after: **1 row remains**, the single genuine `source = 'homepage'` signup from 2026-08-20.
  - **⚠ The DELETE this entry used to recommend would have matched on the wrong column.** It was `source = 'seed' OR email LIKE '%@berrymail.test'`, but the production rows carry **`source = null`**, not `'seed'` — they predate the column's backfill. Only the email-domain half of that condition ever matched. Anyone auditing by `source` would have concluded the table was clean.
  - **The seed can no longer refill it:** `seedNewsletter()` in [seed.ts](../prisma/seed.ts) returns early when `NODE_ENV === "production"`. This is the one seeded model that is a *send list* rather than inert test data, which is why it gets a guard the other fifteen do not.
  - **Timing mattered.** Issue 12 resolved the same day (the sending domain is verified), so the domain now has a reputation to lose. Sending to 199 non-existent addresses would have produced a ~99.5% hard-bounce rate on the first campaign.

- **2026-09-05** — *(was security issue S3)* **Every change made through the admin panel is now recorded.** Migration `20260905030057_admin_audit_log` adds `AdminAuditLog`; nothing before this recorded who changed a price, approved a refund, or deleted a category.
  - **Owner's decisions:** strict transactions, no logging of denied attempts (non-admins are redirected anyway), **SUPERADMIN-only** viewing, **12-month** retention, and orders + returns included.
  - **Strict means strict.** Each log row is written inside the same `prisma.$transaction` as the change it describes, so a change cannot land unlogged — if the log write fails, the change rolls back with it. The cost, accepted deliberately: a broken log table would block admins from working.
  - **Nine write points wired:** product create/update, inventory bulk edits, category create/update/delete, order status, return status. Bulk inventory saves write **one row per product that actually moved**, not one per batch, so "what happened to this product" is answerable — and untouched rows in a batch are not logged at all.
  - **No customer personal data in the log, by design.** Order and return entries store the **order number / return reference** and the transition; the customer's details already live on that record, so the log never becomes a second copy of them. A deletion request therefore does not need to touch it. The one exception is deliberate: a return **rejection note** is recorded, because "why was this refused?" is the question the log exists to answer, and those are the admin's own words.
  - **⚠ The subtle bug this could easily have had:** Prisma returns `price` as a `Decimal` object while the route parses a `number`. Compared raw, **every save would have looked like it changed the price**, filling the log with noise. `diffFields()` normalises Decimal and Date before comparing; there is a test pinning exactly this.
  - **SUPERADMIN restriction is enforced at the query**, not in the UI — `getAdminData(role)` does not fetch the rows at all for a plain `ADMIN`, so they never reach that browser. Hiding the tab is cosmetic on top of that.
  - **Retention runs without a cron:** roughly 1 write in 50 triggers a sweep of rows older than 12 months. It runs outside the transaction and swallows its own errors — housekeeping must never be why an admin's change fails.
  - **Pure logic split into [audit-changes.ts](../src/lib/admin/audit-changes.ts)**, matching how `contact/validate.ts` is split, because the test could not import the module while it pulled in the Prisma client.

  **Verification:** 10 new tests (65 total) covering Decimal-vs-number equality, cleared fields, untouched fields, Date normalisation, and the null-IP rule. Typecheck, lint (28 pre-existing warnings, unchanged) and production build clean. **Not verified in a browser** — needs a SUPERADMIN session.

  **Known limitation, stated plainly:** this records what happens *through the app*. Anyone with the Neon connection string can still change data — or edit this table — without a trace. Real tamper-proofing means shipping logs somewhere the app cannot reach.
- **2026-09-04** — *(from the pre-launch security audit)* **`/api/promo` and `/api/search` are no longer unmetered public endpoints.** They were the only two routes with neither authentication nor rate limiting.
  - **`/api/promo` was a discount-code oracle** — unauthenticated, unlimited, and it answers *"does this code exist?"*, distinguishing invalid from expired from limit-reached. The seeded codes are guessable words (`BERRY10`, `WELCOME20`, `STUDIO50`), so no large dictionary was needed. Now **10 attempts per hour per IP**. **The specific wording was kept deliberately**: a customer holding a genuinely expired code deserves to be told that rather than "didn't work", so the defence is making each guess expensive rather than hiding the answer.
  - **`/api/search` returns the entire catalog in one response** and did so on every call. Now two layers: **CDN caching** (`s-maxage=300, stale-while-revalidate=3600`) so repeat requests never reach the function or the database — this is the layer that absorbs volume — plus **30/hour per IP** for anyone busting the cache to scrape in a loop.
  - **⚠ A hazard the caching introduced, fixed in the same pass:** `tooManyRequests()` now sends `Cache-Control: no-store`. Without it, a 429 on a route that sets `s-maxage` could be cached by the CDN and served to **every** visitor until it expired — one abuser causing an outage. This applies to every route using the helper, not just search.

  **Verification:** new [rate-limit.test.ts](../src/lib/rate-limit.test.ts) — 8 tests pinning the no-store header, `Retry-After` rounding, `x-forwarded-for` parsing, and the fail-open contract. `npm test` **55/55**, typecheck, lint (28 pre-existing warnings, unchanged) and production build clean. **Not verified against a live Redis** — the limits are unexercised until something actually trips them.

  **Does not fix S5:** these limiters fail open like every other one, so they do nothing unless `UPSTASH_*` is set in production.
- **2026-08-19** — *(was P4 issue 23)* **All four legal pages verified in a real browser.** Playwright connected this time, so the visual pass that had been outstanding since 2026-08-03 is done. Checked `/terms`, `/privacy`, `/help/returns` and `/help/shipping` at **360 / 753 / 1425 px**, in both themes.
  - **The specific worry was unfounded.** `/terms`' **18 jump chips** wrap cleanly — 8 rows at 360px, 4 at 753px, 3 at 1425px — with **no clipping and every chip ≥44px tall**. Nothing overflows: `scrollWidth === clientWidth` on all four pages at all three widths, and a sweep of every element's bounding box found **zero** extending past the viewport.
  - **Light theme renders correctly** and all three body-text tokens pass **WCAG AA** against the cream background: `ink` 17.82:1, `ink-dim` 8.84:1, `ink-faint` 5.92:1.
  - **Structure confirmed live**, not just in the HTML: 1 `h1` per page; `/terms` 18 chips / 18 `h2`, `/privacy` 14, `/help/returns` 10, `/help/shipping` 10 — and **every jump-chip anchor resolves to a real section** on all four pages. The Shipping Policy's generated rates render with the right money — Pickup Free, TTPost $25.00, Courier $40.00 — confirming the [shipping.ts](../src/lib/checkout/shipping.ts) derivation survives to the page.
  - **⚠ Found a self-contradiction and fixed it:** the Terms intro still listed *"leaving reviews"* among what the Website is for, while the Customer Reviews section says *"We do not currently accept customer reviews."* That was **my own miss from issue 6** — I rewrote the section and never checked the intro. Removed. *(This edits owner-supplied copy, which the module header says to keep verbatim; a legal page contradicting itself was the worse option.)*
  - **⚠ Found a real bug, logged as issue 26, not fixed:** the public site's light theme **resets on every navigation** — the navbar never persists it, while the admin does, using the same `localStorage` key. Caught precisely because `localStorage` said `light` and the page rendered `dark`. Fixing it properly needs hydration handling, so it is its own task.

  **Verification method matters here:** overflow and tap-target checks were done by measuring `getBoundingClientRect()` across every element rather than eyeballing screenshots, which is why "nothing overflows" is a real claim and not an impression. Screenshots were taken alongside and confirmed the same. Typecheck, `npm test` 48/48 and production build clean after the Terms edit.
- **2026-08-19** — *(was P4 issue 17)* **Orders now carry their own ship-to address.** `/account` had been showing the customer's **current default address** as the destination for every historical order — [account-client.tsx](../src/components/account/account-client.tsx) passed `addresses.find(a => a.isDefault)` into the detail view, so changing your address rewrote where every past order appeared to have gone.
  - **Migration `20260820021856_order_address_snapshot`** adds six nullable columns to `Order` — `shipName`, `shipPhone`, `shipEmail`, `shipLine1`, `shipCity`, `shipLandmark` — matching what the checkout form actually collects (no region/postal/country; every order is domestic).
  - **The migration backfills existing orders** from the JSON the checkout had been stuffing into `Order.notes` as a workaround, so real past orders keep the address they genuinely shipped to. Written as a row-by-row `DO` block with a **per-row exception handler**, because `notes` is `TEXT` and seeded orders hold a plain lorem sentence there — a set-based `notes::jsonb` would abort on the first one. Rows that are not the expected shape are left unsnapshotted, which is correct: they never had an address.
  - **[ship-to.ts](../src/lib/account/ship-to.ts)** is a new pure module: prefer the snapshot columns, fall back to parsing legacy `notes`, and **return null when neither exists**. "Unknown" had to be representable — the alternative is exactly the bug being fixed. Extracted out of the `server-only` query module so it is unit-testable without a database.
  - **Checkout writes the snapshot** alongside the existing `notes` blob, which is kept because it also carries shipping method, payment and promo.
  - **The customer detail view reads `order.shipTo`**, and the `shipTo` prop is gone from `OrderDetailView` entirely, so the old address-book value cannot be passed back in by accident. Landmark now renders as "Near …", which the address book had no field for.
  - **⚠ Scope note — one thing added beyond the issue:** the *admin* order detail view showed **no delivery address at all**, which made it unusable for actually packing an order. Now that the snapshot exists it was a few lines to add a "Ship to" card, so it is in. Legacy orders there say so explicitly rather than showing a blank.

  **Verification:** `npm test` **48/48** (6 new on the resolver — snapshot wins over stale notes, non-JSON notes do not throw, JSON without an address line yields null). Typecheck, lint (28 pre-existing warnings, unchanged) and production build all clean. **Not verified in a browser** — both views need a signed-in session, and confirming the backfill needs an order placed through checkout before today.
- **2026-08-18** — *(was P4 issue 24)* **The newsletter signup writes to a real list, with a working unsubscribe.** It previously took an address, waited 600 ms on a `setTimeout`, showed success, and discarded it.
  - **The table already existed.** `NewsletterSubscriber` has been in the schema since the original migration — the form simply never wrote to it. Extended rather than replaced: added `source`, `unsubscribedAt`, and a unique `unsubscribeToken`.
  - **Migration `20260818040000_newsletter_subscriptions` is hand-written**, because Prisma refused to generate it: the table already held **200 rows**, so a required unique column cannot be added in one step. The SQL adds the token nullable, backfills it with `gen_random_uuid()`, then applies `NOT NULL` and the unique index. **Verified against the live database with an empty `--create-only` probe** — no drift, the hand-written SQL matches the schema exactly.
  - **`POST /api/newsletter`** — rate-limited on the existing contact bucket (5/hour/IP), validates through a shared pure module, and **upserts**: re-signing up an address that had unsubscribed clears `unsubscribedAt`, which is the point. The reply is **identical** whether the address is new, already subscribed, or returning, so the endpoint cannot be used to test whether someone is on the list.
  - **Unsubscribe works without an account** — [`/unsubscribe?token=…`](../src/app/unsubscribe/page.tsx) is idempotent, `noindex`, and stamps `unsubscribedAt` rather than deleting the row, so the link keeps working and there is a record of consent being withdrawn.
  - **[privacy.ts](../src/lib/legal/privacy.ts) gained a Newsletter section** — what is stored, that unsubscribing is one click and needs no contact, and that it stops marketing only: order and account emails are not marketing and keep coming. `LAST_UPDATED` → **August 18, 2026**.
  - **One more unhonoured perk removed on the way past:** the block's own blurb still promised *"members-only discounts"*, the same claim deleted in issue 6c. Now reads "Soft drops and healing tips — … Unsubscribe any time."

  **Verification:** `npm test` **42/42** (5 new on validation and normalisation — case-folding matters, or `Sam@x.com` and `sam@x.com` become two rows that both get the newsletter). Typecheck, lint (28 pre-existing warnings, unchanged) and production build clean, with `/api/newsletter` and `/unsubscribe` both registered. **Not verified in a browser.**

  **⚠ Read issue 25 before sending anything** — the list currently contains 200 fake seeded addresses. Also note nothing *sends* a newsletter yet; this collects the list, it does not mail it.
- **2026-08-18** — *(was P4 issue 16)* **Return requests are real: `ReturnRequest` model, a working form, and an admin queue.** A return had been an email thread with no record and no status anyone could check.
  - **Migration `20260818030809_add_return_requests`**, applied to Neon. New `ReturnStatus` enum (**REQUESTED → APPROVED → REFUNDED**, with **REJECTED** as the dead end) and a `ReturnRequest` model scoped to **one OrderItem**, not a whole order — that is what the customer picks and what the policy describes, so two items returned from one order open two requests with separate outcomes. The product is reachable through `orderItem`, so it is not duplicated on the row.
  - **⚠ A schema trap worth remembering:** adding the back-relations with `sed` matched `Product` and `ProductVariant` as well as the intended models, and **`prisma format` then silently auto-completed the other side**, giving `ReturnRequest` `productId` and `productVariantId` columns nobody asked for. `prisma validate` passed — the schema was consistent, just wrong. Caught by reading the formatted model before migrating. Always re-read a model after `prisma format` adds a relation.
  - **Final sale is now enforced, not advised.** `allowedReasonsFor(categorySlug)` drops **"Changed Mind"** on final-sale items, so the form does not offer it and `POST /api/account/returns` re-checks the same rule server-side — the select is a convenience, not the gate. **This supersedes the "advisory, not a gate" note in issue 7's entry below**, which was written when there was no submission flow to gate. Every *fault* reason stays available on final-sale items, which is the carve-out the policy and the Sale of Goods Act both require.
  - **Customer flow** — [account/returns-view.tsx](../src/components/account/returns-view.tsx) is a real form (item → reason → notes) plus a list of requests showing reference, status and any admin note. Items already under an open request are **left out of the picker** rather than offered and refused. The API validates ownership, delivery state and category from the **database**, never from the request body.
  - **Admin queue** — new Returns tab ([admin/returns-view.tsx](../src/components/admin/returns-view.tsx)) with a "Needs action" filter and a sidebar badge. Only forward transitions are offered; `REJECTED`/`REFUNDED` are terminal and the API refuses to reopen them, so the buttons disappear rather than failing. **Rejecting requires a note**, since that is the thing a customer would otherwise write in to ask about. Built deliberately — a model with no admin screen would have repeated the reviews black hole (issue 6).
  - **References** are `RT-####`, `@unique`, retried on collision with a timestamp fallback so a clash cannot fail a customer's request.

  **Verification:** `npm test` **37/37** (5 new, covering the reason gate on final-sale and returnable categories, unknown categories, and reasons not on the list at all). Typecheck, lint (28 pre-existing warnings, unchanged) and production build clean, with `/api/account/returns` and `/api/admin/returns` both registered. **Not verified in a browser** — both surfaces need a signed-in session, and the admin queue additionally needs a delivered order to request against.

  **Still open:** nothing emails the customer when a request changes status, and nothing emails the owner when one arrives — the admin badge is the only signal. Approving does not move money; `REFUNDED` is a record that someone issued a refund by hand.
- **2026-08-17** — *(was P1 issue 6c)* **The unhonoured membership perks are gone.** The issue listed two claims in two files; the sweep found the aftercare-guide promise in **five** places, one of them a dead link.
  - **"10% off your first order"** — removed from [login/page.tsx](../src/app/login/page.tsx) and the [newsletter.tsx](../src/components/home/newsletter.tsx) perk row. No signup discount exists; the seeded codes are all manual entry and the one named `WELCOME20` is **20%**, so even the number was wrong.
  - **The aftercare guide, which has never existed**, removed from: the login pitch, the newsletter perks, the [hero marquee](../src/components/home/hero.tsx) ("Free piercing aftercare guide"), and the cart's [order-summary.tsx](../src/components/cart/order-summary.tsx) ("Free aftercare guide with every order").
  - **⚠ A dead link nobody had logged** — [faq.tsx](../src/components/home/faq.tsx) carried a whole promo card for a *"Free Aftercare Guide … 12-page studio-tested guide … emailed straight to your inbox"* whose CTA pointed at **`/aftercare-guide`, which has never been a route**. The `/aftercare-guide` footer link was commented out long ago ([footer.tsx:13](../src/components/layout/footer.tsx#L13)); this live one was missed. The card is a sticky grid column, so deleting it needed layout rework — and its photo is literally an aftercare kit. It now promotes the **real aftercare range** (`/products?category=aftercare`, "Aftercare Essentials", CTA "Shop aftercare"), which removes the false claim and fixes the dead link without a redesign. *Say the word if you would rather the card went entirely.*
  - **The login pitch now sells what actually exists** — "Track your orders, save the pieces you love, and check out faster next time." All three are real: `/account?view=orders`, the auth-gated wishlist, and checkout prefilling from the saved default address.
  - **The newsletter perk row is down to one item**, "Early access drops" — and note the newsletter **does not work**: [newsletter.tsx](../src/components/home/newsletter.tsx) still has `// TODO: wire to real subscribe action` and fakes success with a 600 ms timer, so nobody is subscribed to receive those drops. **Logged as new issue 24.**

  **Verification:** zero live occurrences of "10% off", "aftercare guide" or `/aftercare-guide` in `src` outside explanatory comments. Typecheck, `npm test` 32/32, lint (28 pre-existing warnings, unchanged) and production build all clean. **Not visually verified** — the hero marquee dropped to 2 items and the cart perk list to 2.
- **2026-08-17** — *(was P1 issue 6b)* **The fabricated customer count is gone from both places it appeared.**
  - **Homepage hero tile deleted** — [hero.tsx](../src/components/home/hero.tsx). The whole block went, not just the number: it was four decorative gradient circles standing in for customer avatars plus *"Trusted by 12,400+ sweet berries worldwide — and counting."* There was no coherent partial removal — strip the figure and the sentence reads *"Trusted by sweet berries worldwide"*, still fake social proof, still implying customers via the avatars, and **"worldwide" separately contradicts the [Shipping Policy](../src/lib/legal/shipping-policy.ts)**, which says the business does not ship internationally.
  - **A second instance the register never listed** — [login/page.tsx](../src/app/login/page.tsx) opened its signup pitch with *"Join 12,400+ berries"*, the same invented figure. Removed; the rest of that sentence was left alone and logged as **new issue 6c**, since it advertises a signup discount and free aftercare that do not exist.

  **Verification:** zero occurrences of `12,400`, `2,400` or "Trusted by" anywhere in `src`. Typecheck, `npm test` 32/32, lint (28 pre-existing warnings, unchanged) and production build all clean. **Not visually verified** — the hero lost a block beneath its CTA row, so the column spacing is worth a look.
- **2026-08-17** — *(owner rule change, not an issue fix)* **Jewelry and aftercare are now FINAL SALE.** The owner's rule: nothing comes back once it has left the business. This replaced the 14-day-on-sealed-jewelry position published hours earlier the same day, so parts of the 1a entry below are already superseded — the *claims* it fixed were made accurate, then the underlying policy changed.
  - **Scope, as decided:** final sale covers **jewelry, aftercare and elixirs**; **merch and accessories stay returnable** while unused within **14 days** (no hygiene risk in a tote bag). **Cancellation before dispatch is still allowed** with a full refund — nothing has left yet.
  - **⚠ The one thing deliberately not disclaimed:** items that arrive **damaged, defective, or incorrect** are always replaced or refunded, final sale or not, with postage on us. A blanket no-returns term would not survive the **Sale of Goods Act** — goods must be of merchantable quality and match their description, and a published term cannot remove that. The owner was asked and chose this carve-out. The Terms now say so explicitly, including that nothing in them removes a customer's statutory rights.
  - **`isHygieneExcluded` renamed `isFinalSale`** in [returns.ts](../src/lib/account/returns.ts). The allowlist logic is unchanged — the *consequence* changed from "returnable while sealed" to "does not come back", and the old name would have been a lie in every call site.
  - **Surfaces updated:** [returns-policy.ts](../src/lib/legal/returns-policy.ts) (the "Return Window" section is gone, folded into eligibility; "Items That Cannot Be Returned" became **"Jewelry and Aftercare Are Final Sale"**), [terms.ts](../src/lib/legal/terms.ts), [trust-strip.tsx](../src/components/cart/trust-strip.tsx), [product-trust-badges.tsx](../src/components/product/product-trust-badges.tsx), the PDP accordion, [returns-view.tsx](../src/components/account/returns-view.tsx) and the admin [categories-view.tsx](../src/components/admin/categories-view.tsx) pill. `LAST_UPDATED` bumped to **August 17, 2026** on both legal pages.
  - **The PDP is now product-aware:** `ProductTrustBadges` takes a `categorySlug` and renders **"Final sale"** or **"Easy returns"** accordingly, and the accordion copy branches the same way. A single badge would have been wrong on half the catalogue — a tee is not final sale.
  - **The cart strip states the rule instead of a promise** — it cannot know what is in the bag, so it reads *"Final sale on jewelry · merch returnable in 14 days · faults always covered."*

  **Verification:** `npm test` **32/32**, including three new assertions that the *published* policy really says final sale, really keeps the damaged/defective carve-out, and never says "free returns". Typecheck, lint (28 pre-existing warnings, unchanged) and production build all clean. **Not visually verified.**

  **Still open:** the account Returns view lets a customer open a request against any delivered order and only *labels* items final sale — it is a heads-up, not a gate (see issue 16; there is still no `ReturnRequest` model to gate).
- **2026-08-17** — *(was P1 issue 1a)* **The last three product-page and cart claims now match the published policies**, and are generated rather than retyped so they cannot drift again.
  - **"Free returns" deleted** — [trust-strip.tsx](../src/components/cart/trust-strip.tsx) now reads *"Sealed, unopened pieces · return postage yours"*. Change-of-mind postage is the customer's, per the owner's 2026-08-15 sign-off.
  - **"Store credit" corrected** — the PDP accordion now says refunds go to **the original payment method**, which is what the Returns Policy has always said.
  - **"2–4 business days" replaced with the real rate table** — the accordion now lists Pickup / TTPost / Courier with fees and ETAs **generated from [shipping.ts](../src/lib/checkout/shipping.ts)**, the same module the checkout API charges from. The old figure matched no method the site offers. This is the pattern [shipping-policy.ts](../src/lib/legal/shipping-policy.ts) already used; the PDP simply wasn't wired to it.
  - **A fourth error the register never listed:** both badges said returns apply to **"unworn"** pieces. The hygiene exclusion turns on whether the packaging was **opened**, not whether the item was worn — an opened-but-unworn piece cannot come back. Both now say *sealed*. [product-trust-badges.tsx](../src/components/product/product-trust-badges.tsx) had been declared correct and dropped from the table on 2026-08-15 because its **14 days** was right; the "unworn" wording next to it was not.
  - **`RETURN_WINDOW_DAYS` added to [returns.ts](../src/lib/account/returns.ts)** — one constant, imported by the cart strip, the product badge, the PDP accordion **and** `OWNER_DECISIONS` in [returns-policy.ts](../src/lib/legal/returns-policy.ts). It lives in that light client-safe module rather than in the policy document so the cart doesn't pull the whole legal doc into the browser bundle. Changing the window is now a one-line edit that moves every surface at once.

  **Verification:** two new tests — one pinning the constant, one asserting the **rendered policy section** actually contains the same window, since a constant agreeing with itself proves nothing. `npm test` **29/29**, typecheck, lint (28 pre-existing warnings, unchanged) and production build all clean. Zero occurrences of "store credit", "2–4 business", "Free returns" or "Unworn pieces" left in `src` outside the explanatory comments. **Not visually verified** — the accordion body went from one sentence to a short list, so it is worth a look on a narrow viewport.
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
