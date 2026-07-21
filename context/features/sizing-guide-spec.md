# PRD — Jewelry Sizing Guide Page

**Product:** SherryBerries (luxury body-jewelry e-commerce)
**Feature:** Dedicated sizing guide page (`sizing.html`)
**Status:** Shipped · v1
**Last updated:** July 20, 2026

---

## 1. Problem & Goal
Piercing jewelry is sized in unfamiliar units (gauge, diameter, length) and the correct size varies by piercing placement. Shoppers frequently guess wrong, leading to returns, uncomfortable fits, and support load. Product pages link to a "Sizing guide" but there was no destination.

**Goal:** Give shoppers a single, authoritative page that explains how piercing jewelry is measured and what size to buy for their specific piercing — reducing sizing-related returns and pre-purchase hesitation.

**Success signals:** Fewer sizing-related returns and support messages, higher product-page → add-to-cart conversion for sessions that visit the guide, engagement with the "free sizing help" CTA.

---

## 2. Scope

**In scope**
- A standalone content page reachable from the nav, footer "Size Guide" link, and product-page "Sizing guide" / "Material guide" links.
- Education on the three measurements: gauge (thickness), size (diameter/length), and material safety.
- Per-piercing recommended sizes for the most-requested placements.
- A "how to measure at home" walkthrough and a free WhatsApp sizing CTA.
- A sizing FAQ.

**Out of scope (v1)**
- An interactive size calculator or printable ruler tool.
- Per-product size availability or stock integration.
- Localized units toggle beyond showing mm + inches in the gauge table.
- Account-saved sizing profiles.

---

## 3. User Stories
- As a first-time buyer, I want to understand what "16G, 8mm" means so I can order correctly.
- As someone with a specific piercing (e.g. septum), I want to see the standard gauge and size at a glance.
- As a careful shopper, I want to confirm which materials are safe for a fresh vs. healed piercing.
- As someone unsure of my size, I want a quick way to get expert help before buying.

---

## 4. Content Requirements

### Section 1 — Gauge (thickness)
- Explain gauge, and the counter-intuitive rule: higher number = thinner.
- Visual bar scale (20G → 10G) showing relative thickness.
- Conversion table: gauge · millimeters · inches · common uses.
- Safety note: never force a thicker gauge; stretch with a professional.

### Section 2 — Diameter & length
- Two diagram cards: rings/hoops (measure inner diameter) vs. barbells/studs (measure the wearable bar, not the ends).
- Common size chips (6/8/10/12mm).

### Section 3 — Size by placement
- Card per piercing (earlobe, helix/cartilage, conch, tragus, nostril, septum, navel, eyebrow, tongue, nipple, daith, industrial).
- Each card lists recommended gauge, size, common styles, and a short fit note.
- Note where fresh piercings start longer and downsize once healed.

### Section 4 — How to measure at home
- 4 numbered steps (remove a fitting piece → lay on mm ruler → measure the correct span → note the gauge).
- "Size you for free" WhatsApp callout with photo-for-scale guidance.

### Section 5 — Safe by material
- 6 material cards, color-coded: fresh-safe (titanium, solid gold, niobium), healed-only (surgical steel), avoid-in-fresh (plated/filled, sterling silver).

### FAQ
- Between-sizes guidance, why fresh piercings need longer bars, DIY gauge changes, gauge→mm conversion, and the free sizing offer.

### CTA
- Close with a "shop the collection" call to action.

---

## 5. Design Requirements
- Reuse the site's theme tokens, floating pill nav, footer, search overlay, cart drawer, and accordion pattern — the page must feel native, not bolted on.
- Typographic system consistent with the rest of the site (display + serif headings, Inter body; pink/gold accents; max 1–2 accent colors).
- Hero with breadcrumb, eyebrow, display headline, intro, and jump links.
- Alternating section backgrounds for rhythm; cards use existing border/hover/shadow vocabulary.
- Diagrams are simple inline SVG (no photography needed for the measurement concepts).
- `fade-up` entrance animations consistent with the homepage.

---

## 6. Non-Functional Requirements
- Fully client-side; content is data-driven in `sizing.js` so copy/sizes are editable without touching layout.
- Loads with zero console errors and includes the cart-drawer markup app.js expects.
- Dark and light theme support.
- Responsive: tables collapse to labeled stacked rows on mobile; placement/material/step grids reflow (4→3→2→1 columns); nav icons remain tappable.
- Accessible: semantic headings, keyboard-operable accordion, labelled controls; hit targets ≥44px on mobile.
- Cache-busted asset versions so returning visitors get the latest.

---

## 7. Acceptance Criteria
- [ ] Page reachable and renders all six content areas (gauge, size, placements, measure, materials, FAQ) plus hero and CTA.
- [ ] Gauge scale + conversion table display and the table stacks with labels on mobile.
- [ ] 12 placement cards each show gauge, size, styles, and a note.
- [ ] Materials are correctly color-coded by fresh-safety.
- [ ] FAQ accordion expands/collapses; cart pill opens/closes the drawer; search overlay works.
- [ ] No console errors on load; homepage sections are NOT injected into this page.
- [ ] Works across dark/light theme and mobile breakpoints.

---

## 8. Implementation Notes (as built)
- Markup in `sizing.html`, styles in `sizing.css`, content + rendering in `sizing.js`.
- Shared chrome comes from `app.js`; a one-line guard (`$("#content") || throwaway node`) lets app.js run on sub-pages without injecting homepage content.
- Placement, gauge, step, material, and FAQ data are arrays in `sizing.js` for easy editing.

---

## 9. Future (v2+)
- Interactive size finder (answer a few questions → recommended gauge/size).
- Printable mm ruler / at-home measuring aid.
- Per-product size availability and "add recommended size to bag".
- Units toggle (mm/inches) and localization.
- Link sizing results to saved account preferences.
