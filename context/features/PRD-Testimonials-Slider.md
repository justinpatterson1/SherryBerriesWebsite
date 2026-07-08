# PRD — Homepage Testimonials Slider

**Product:** SherryBerries (luxury body-jewelry e-commerce)
**Feature:** Customer reviews carousel on the homepage
**Status:** Shipped · v1
**Last updated:** June 22, 2026

---

## 1. Problem & Goal
New visitors land on the homepage with no social proof above the fold of the lower sections. We want to surface real customer reviews in a compact, browsable format that builds trust without adding page length.

**Goal:** Display verified customer testimonials in a space-efficient, on-brand slider that reinforces product trust (comfort, safe healing, quality).

**Success signals:** Increased scroll-depth past the reviews section, higher add-to-cart rate from sessions that interact with the slider.

---

## 2. Scope

**In scope**
- A "Reviews" section on the homepage between the Berry Elixir and Community sections.
- A horizontal slider of testimonial cards with manual + auto navigation.
- Each card: star rating, quote, reviewer avatar (with initials fallback), name, verified-buyer badge, location, and recency.

**Out of scope (v1)**
- Submitting/collecting reviews from the site.
- Aggregate rating breakdown panel and per-card product attribution (explicitly removed).
- Filtering, sorting, or a full reviews listing page.

---

## 3. Requirements

### Content
- Pull testimonials from a single data source (`SB.testimonials`) so copy is editable without touching layout.
- Each entry: `name`, `loc`, `rating` (1–5), `date`, `img`, `quote`.
- Section header: eyebrow "Reviews · Verified buyers", heading, and a supporting line referencing total review count.

### Slider behavior
- **Responsive paging:** 3 cards per page (desktop), 2 (tablet ≤1024px), 1 (mobile ≤640px). Card widths and page count recompute on resize.
- **Navigation:** prev/next arrows (disabled at the respective ends), pagination dots reflecting current page and clickable to jump.
- **Autoplay:** advances every 6s, loops back to the first page; pauses on hover.
- **Touch:** swipe left/right to change pages.
- **Transition:** smooth eased slide (~0.55s).

### Visual / brand
- Reuse existing theme tokens (card background, lines, pink/gold accents, serif quote type).
- Card hover: border + shadow lift only (no vertical movement, since cards live in a transformed track).
- Star ratings in gold; verified badge as a pink checkmark.

### Resilience
- Avatar images fall back to reviewer initials on load error.
- The slider's resting state must show content even if JS doesn't run (no blank section).
- Scripts/styles are cache-busted (versioned query strings) so updates reflect for returning visitors.

---

## 4. Acceptance Criteria
- [ ] Reviews section renders between Elixir and Community.
- [ ] No aggregate ratings panel; no per-card product line.
- [ ] Correct cards-per-page at desktop/tablet/mobile breakpoints.
- [ ] Arrows, dots, swipe, and autoplay all change the visible page; dots track state.
- [ ] Broken avatar URLs show initials, not empty circles.
- [ ] Section is keyboard- and screen-reader-labelled (arrows and dots have `aria-label`s).

---

## 5. Implementation Notes (as built)
- Markup + logic in `app.js` (`SECTION 6.5`), styles in `styles.css` (`REVIEWS / TESTIMONIALS`), data in `data.js` (`SB.testimonials`).
- Paging translates the flex track in pixels relative to the viewport width for accurate multi-card pages.
