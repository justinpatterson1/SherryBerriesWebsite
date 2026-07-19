# PRD — Site Search

**Product:** SherryBerries (luxury body-jewelry e-commerce)
**Feature:** Instant product & category search
**Status:** Proposed · v1
**Last updated:** July 18, 2026

---

## 1. Problem & Goal
The header already shows a search icon, but it does nothing. Visitors who arrive knowing what they want (e.g. "titanium septum", "belly ring", "aftercare") have no way to jump straight to it — they must browse category by category. This adds friction for high-intent shoppers and hides the depth of the catalog.

**Goal:** Let a shopper find any product, category, or help topic in a few keystrokes, from anywhere on the site, without a page reload.

**Success signals:** Higher search-to-product-click rate, shorter time-to-add-to-cart for sessions that use search, fewer zero-result exits.

---

## 2. Scope

**In scope**
- Activating the existing nav search icon to open a full search experience.
- An overlay/command-palette search launched from the header (and via `/` or `Cmd/Ctrl-K` keyboard shortcut).
- Instant client-side results as the user types, over the existing catalog (`SB.categories`, `SB.bestsellers`).
- Result grouping (Products, Categories, Suggestions), keyboard navigation, and an empty/zero-result state.
- Recent searches and a set of curated "popular searches" chips.

**Out of scope (v1)**
- A dedicated `/search` results page with filters/sort (can be v2 — the overlay can "See all results" linking to it later).
- Server-side / fuzzy search infrastructure, typo correction, synonyms engine.
- Personalized or ML-ranked results.
- Voice or image search.

---

## 3. User Stories
- As a high-intent shopper, I click the search icon (or press `/`) and immediately type, seeing matching products with thumbnail, name, and price.
- As a keyboard user, I move through results with ↑/↓ and open one with Enter, all without touching the mouse.
- As a browser, if I'm not sure what to type, I see popular searches and my recent searches as one-tap chips.
- As someone who mistypes, if there are no matches I get a friendly empty state with suggested categories instead of a dead end.

---

## 4. Requirements

### Entry points
- Header search icon becomes a button that opens the search overlay (all pages that share the nav).
- Global keyboard shortcut: `/` or `Cmd/Ctrl-K` opens it; `Esc` closes it.
- Focus lands in the input automatically on open; background scroll is locked while open.

### Query & matching (client-side, v1)
- Search across product `name`, `cat`, and material tags (`mat`), plus category `name` and `desc`.
- Case-insensitive substring match; results ranked by match strength (name match > category match > tag match).
- Debounced input (~120ms) so typing feels instant but doesn't thrash.
- Matching text in results is highlighted.

### Results presentation
- Grouped sections in this order: **Products**, **Categories**, then **Suggestions** (popular searches).
- Product result row: thumbnail, name, category label, price (and "was" strike price if on sale).
- Category result row: name + short description, links to that category.
- Cap products shown (e.g. 6) with a "See all N results" affordance reserved for the future results page.
- Show a live result count.

### States
- **Idle (empty input):** recent searches (from `localStorage`) + curated popular-search chips + optionally a few bestsellers.
- **Typing:** grouped live results.
- **Zero results:** clear message + suggested categories to browse instead; never a blank panel.
- Recent searches persist to `localStorage`; user can clear them.

### Behavior
- Selecting a product navigates to its product page; selecting a category navigates to that category view/anchor.
- Overlay closes on selection, on `Esc`, and on clicking the scrim.
- Committing a query (Enter on the input) records it to recent searches.

### Non-functional
- Fully client-side; no new dependencies; reuses existing data source.
- Works in both dark and light theme.
- Accessible: input is labelled, results are keyboard-navigable, active option is announced (`aria-activedescendant`/`role="listbox"`), and the overlay traps focus.
- Cache-bust updated `app.js`/`styles.css` (versioned query strings) so returning visitors get the new behavior.

---

## 5. Design Features

**Pattern:** command-palette style overlay (modern, on-brand, space-efficient) rather than an inline dropdown — it centers attention and works identically on mobile and desktop.

- **Launch animation:** overlay fades in with a soft scrim + backdrop blur; the search panel eases down/scales from the nav. Reuse the site's existing scrim/drawer motion language.
- **Panel:** rounded card on `--bg-card` with `--line` border and the same shadow vocabulary as the cart drawer; a large search input at top with the magnifier icon and a subtle "Press Esc to close / ⌘K" hint.
- **Type & color:** serif for group headings and product names, Inter for meta; pink/gold accents for the active row and highlighted match text. Max 1–2 accent colors, consistent with the rest of the site.
- **Result rows:** thumbnail in a rounded tile, hover/active state with a pink-tinted background and left accent, price in the serif face. Generous 44px+ hit targets for mobile.
- **Chips:** pill-shaped recent/popular search chips matching the existing tag styling.
- **Empty state:** a small brand mark (✦) with a warm one-liner and 3–4 category shortcuts.
- **Mobile:** overlay goes near-fullscreen; input pinned to top, results scroll beneath; keyboard-safe padding.

---

## 6. Acceptance Criteria
- [ ] Clicking the nav search icon (and `/` or `Cmd/Ctrl-K`) opens the overlay with the input focused.
- [ ] Typing shows grouped, ranked, instant results with highlighted matches and a live count.
- [ ] ↑/↓ move the active result, Enter opens it, Esc / scrim click closes the overlay.
- [ ] Selecting a product goes to its product page; selecting a category goes to that category.
- [ ] Idle state shows recent (persisted) + popular searches; recent can be cleared.
- [ ] Zero-result state shows a message and category suggestions, never a blank panel.
- [ ] Works in dark and light theme and down to mobile widths with proper focus trapping.

---

## 7. Implementation Notes (proposed)
- Add search overlay markup + logic to the shared nav script path (`app.js`), styles under a new `SEARCH` block in `styles.css`, and any curated popular-search list to `data.js` (e.g. `SB.popularSearches`).
- Build the search index from `SB.categories` and `SB.bestsellers` at load; no new data model required for v1.
- Keep a single source of truth so the same overlay can be dropped into every page that includes the nav.

---

## 8. Future (v2+)
- Dedicated `/search` results page with filters (category, material, price, availability) and sort.
- Fuzzy matching, synonyms ("nose ring" ↔ "nostril"), and typo tolerance.
- Search analytics (top queries, zero-result queries) to guide merchandising.
- Personalized ranking and "trending now" suggestions.
