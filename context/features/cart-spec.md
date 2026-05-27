Build a full-page shopping cart for SherryBerries, a luxury body-jewelry brand with a dark feminine pink/black aesthetic. The site already has design tokens defined (CSS custom properties for --bg, --bg-card, --text, --text-dim, --text-faint, --blush, --pink, --pink-deep, --pink-glow, --gold, --gold-soft, --line, --line-strong, --line-pink; fonts --display = Italiana, --serif = Playfair Display, --sans = Inter, --script = Caveat) and a [data-theme="light"] override block. Theme is persisted via localStorage["sb-theme"] and applied before paint via a tiny inline <script> in <head>.

Files to produce
cart.html — the page markup
cart.js — all interactions (vanilla JS, IIFE-wrapped, no framework)
Append cart-specific styles to existing styles.css
Page chrome (matches the rest of the site)
Floating pill navbar (.nav > .nav-row) fixed 18px from top, glassmorphic with backdrop-blur, 999px radius, pink-tinted shadow. Logo on left ("SherryBerries" — "Berries" in italic Playfair, --pink), 5 uppercase nav links in middle (Shop, Bestsellers, Our Story, Learn, Community — all link to SherryBerries.html#section), and on right: theme toggle (sun/moon SVGs that swap), search, account → login.html, wishlist with count badge, and a hot-pink-gradient "Bag" pill linking to cart.html.
Floating WhatsApp FAB at bottom-right (56×56 green-gradient circle with hover tooltip).
Toast element fixed bottom-right (#toast).
Shared footer (5-column: brand block with logo/socials/payment chips + Shop/Care/Help/Follow link columns + legal row) injected via JS at end of body.
Page header
Above the title: a small uppercase "Continue shopping" back-link with a left-arrow, linking to SherryBerries.html#shop, muted color, hover → blush.
Title row in a 1px-bottom-bordered grid:
Left: 64px Italiana headline Your bag. with "bag" in italic Playfair, blush.
Right: a small uppercase meta line "✦ $22 from free shipping" — driven by #freeShipBadge and #freeShipMsg IDs. When the (subtotal − discount) ≥ $80 threshold, it flips to "✓ You unlocked free shipping ✦"; when bag is empty, "✦ Free shipping over $80".
Main layout (.cart-layout)
Two columns: 1fr 400px with 60px gap; stacks vertically below 980px.

Left column — cart items list (.cart-list)
Render one .cart-row per item. Each row is a 3-col grid (140px image / flex info / right price+qty stack) inside a 1px-bordered, 20px-radius, var(--bg-card) card with hover → pink-tinted border. Below 640px, collapse to a 2-col grid with the price+qty stack spanning both columns underneath as a divider row.

Row contents:

Image cell (.cr-img) — 1:1 aspect, 14px radius, image fills. If it.gift is true, overlay a small gold-gradient "★ Gift" pill in the top-left.
Info cell (.cr-info):
Small blush uppercase category eyebrow (e.g., "Belly")
19px Playfair name as a link to product.html
Variant chips row — small Material: **Titanium**, Length: **10mm**, Stone: **Pink Opal** separated entries (key in muted text, value in --text)
If gift wrap is on with a message, show an italic blush quote line "Happy anniversary, my love."
Stock badge — small uppercase line with a glowing 6px circular dot. Variants: green (oklch(0.78 0.12 150)) "In stock · ships today", or amber (--gold-soft) "Only 3 left — last chance"
Actions row (3 small ghost buttons, 11px uppercase, muted, hover blush): "♡ Save for later", "🎁 Add gift wrap (+$6)" / "Remove gift wrap" (toggle), "✕ Remove"
Right price+qty cell (.cr-price-col) — vertical stack, right-aligned, space-between:
Price block: struck-through original $92 + current $78 in 22px Playfair. When qty > 1, append $26 each caption in 10px uppercase muted text below.
Qty stepper — pill-shaped (999px radius), 38px tall, 1px subtle border. − button (34×38), value in 13px bold (28px min-width centered), + button. Hover → blush + faint pink bg tint.
When removing: add .removing class which fades the row out (opacity: 0; transform: translateX(40px)) over 280ms before deleting from state and re-rendering.

Saved for later (.saved-section)
Appears below the cart list if saved items exist. Header row: 28px Italiana "Saved for later" (italic Playfair "later") on the left, "3 items" small uppercase muted count on the right. Below: a 3-col grid (1 col on mobile) of compact cards. Each card is a 90px image + name (14px Playfair) + price (15px Playfair) + a 36×36 circular + button on the right that moves the item back to the bag with a "Moved to bag ✦" toast.

Right column — sticky order summary (.cart-summary)
position: sticky; top: 100px. 28px padding, 22px radius, var(--bg-card) background with pink-tinted 1px border and a deep soft shadow. Vertical stack with 20px gap.

Contents (in order):

Heading — 28px Italiana "Order summary" with a 1px bottom border underneath
Promo code area:
When unapplied: a 2-col grid with a 44px-tall uppercase-styled text input (placeholder "Promo code") and an "Apply" button. Input focus → pink border + faint pink bg.
When applied: a dashed-pink-bordered chip showing <code> — <label> with a small ✕ to remove
Hardcoded codes: SWEET10 (10% off — sweet welcome), BERRY20 (20% off — VIP berry), FRESH15 (15% off — fresh piercing)
Totals (.sum-rows) — stacked 14px label/value rows:
"Subtotal · N items" → $xx.xx
"Promo discount (10%)" → "−$x.xx" (only if applied, blush color)
"Gift wrap" → "$6.00" (only if any item has gift wrap on)
"Shipping" → "Free ✦" (green uppercase if free) or "$6.00"
"Estimated tax" → "$x.xx" (8.75% of subtotal − discount)
1px divider
Total row — 22px Italiana "Total" on left, 32px Playfair grand total on right
Below: tiny muted "or 4 interest-free payments of $xx.xx with Afterpay"
Secure checkout → — full-width 56px hot-pink-gradient pill (gradient shifts gold→pink on hover via ::before pseudo) with cart-arrow icon. On click, swap to "Redirecting…" for 1.1s then toast "This is a mockup — checkout coming soon ✦"
Divider "express checkout" (hairlines on both sides)
Express row — 2-col grid: purple #5a31f4 "Shop Pay" button + outlined "PayPal" button (44px tall)
Perks list — 3 small lines with circular pink checkmark icons: "256-bit SSL secure checkout", "Free aftercare guide with every order", "Tracked shipping from Brooklyn"
Empty state
When the cart has zero items, swap the entire layout for a single centered .cart-empty card (max-width 480px, 24px radius, var(--bg-card) background, soft pink radial glow inside): huge pink ♡ icon (72px), 38px Italiana headline "Your bag is sweet but empty." ("sweet" in italic Playfair blush), muted paragraph about starting your collection, and two CTAs side-by-side: "Shop the collection →" (pink gradient) and "View bestsellers" (ghost).

Trust strip at page bottom
A 4-col grid (2-col on mobile) inside a 1px-bordered, 20px-radius card with a subtle pink-gold linear-gradient tint. Each cell: a small 36×36 circular pink-tinted icon, then 15px Playfair label, then 11px muted caption. Items: "Free shipping / On orders over $80 · ships from Brooklyn", "30-day returns / Free returns on unworn pieces", "Hypoallergenic / Implant-grade titanium & solid gold", "Pay in 4 / Interest-free with Afterpay".

cart.js — interactions to wire up
Wrap everything in an IIFE. Define $(sel) and $$(sel) helpers, a ph(url, alt) image helper (returns markup with <img> inside .ph wrapper, falls back to gradient placeholder on onerror), and SBToast(msg) (sets #toast text, adds .show, removes after 2200ms via shared timeout).

State (persisted in sessionStorage)
sb-cart-rich — array of { key, id, qty, mat, size, stone, gift, giftMsg } (the key is a unique string per cart line, e.g., "1::ti-10-opal", so two of the same product with different variants stay separate)
sb-saved — array of { id, mat, size }
sb-wish — array of product IDs
sb-promo — { code, pct, label } or null
Also mirror back a sb-cart legacy {id: qty} map for drawer compatibility with other pages
On first load (no sb-cart-rich in storage), seed with 3 demo items so the page looks lived-in: a "Berry Glow Belly Curve" with gift wrap and message "Happy anniversary, my love.", a 14k gold cartilage hoop at qty 2, and a "Berry Elixir" aftercare bottle.

Product lookup
findProduct(id) returns from SB.bestsellers array (from data.js), with a hardcoded extra entry for the Berry Elixir (id "elixir", price $36, was $48, Unsplash image).

Computed totals
subtotal = sum(p.price * it.qty)
giftWrap = $6 if any item has gift=true else $0
discount = subtotal * promo.pct / 100 (if promo applied)
shipping = $0 if (subtotal - discount) >= 80 else $6
tax      = (subtotal - discount) * 0.0875
total    = subtotal - discount + shipping + giftWrap + tax
Rendering
Single render() function reads state, computes totals, and replaces #cartRoot.innerHTML. After re-render, call updateChrome(totalQty, totals) to refresh the nav cart count, wishlist badge, and the free-shipping progress text in the header.

Delegated click handlers on #cartRoot (single listener)
[data-inc] → increment qty (cap at 10)
[data-dec] → decrement qty (min 1)
[data-remove] → add .removing class to row, after 280ms remove from state, re-render, toast "Removed from bag"
[data-save] → push to saved array, remove from cart, toast "Saved for later ♡"
[data-gift] → toggle gift flag, toast "Gift wrap added — $6" or "Gift wrap removed"
[data-move] → move saved item back to cart, toast "Moved to bag ✦"
#promoApply → uppercase the input value, match against the hardcoded promo map, set promo state and toast ✦ ${code} applied — ${label}. If invalid: toast "Hmm, that code didn't work"
#promoRemove → clear promo, toast "Promo removed"
#checkoutBtn → save original button HTML, swap to "Redirecting…", disable pointer events for 1.1s, then toast the mockup message and restore
Also bind a keydown on document so pressing Enter inside #promoInput triggers the Apply button.

Other chrome
Wishlist button toasts current count
Theme toggle flips data-theme, persists to localStorage, toasts "Lights on — sweet & bright ☀" or "Lights low — back to glow ✦"
Window scroll handler toggles .scrolled on #nav after 20px
styles.css — sections to append
All new selectors prefixed by .cart-page, .cart-, .cr-, .saved, .promo-, .sum-, .checkout-, .express-, .divider-or, .perks, .trust-strip, .cart-empty. Include [data-theme="light"] overrides for the summary card (cream-tinted gradient), promo input (white bg), express buttons (white bg), Shop Pay keeps its purple, PayPal text color flips to navy #00457c in light mode.

Use the same shadow/glow/border-radius language as the PDP and landing page — no new visual primitives. The cart page should read as "the same garment, opened to a different page" — same chrome, same toast system, same WhatsApp FAB, same theme-toggle behavior — just with a denser transactional center.