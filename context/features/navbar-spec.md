## 1. Floating Pill Navbar

A glassmorphic pill floating 18px from the top, centered, max-width 1180px. Logo on the left, nav links in the middle, action icons on the right ending in a pink gradient "Bag" pill.

### Recreation prompt
> Build a floating navigation bar component for a luxury jewelry e-commerce site. Position: fixed, 18px from top, centered horizontally, max-width 1180px. The pill has a translucent dark background `rgba(15,12,13,0.72)` with `backdrop-filter: blur(20px) saturate(140%)`, a 1px subtle border, fully rounded (`border-radius: 999px`), and a soft shadow including a pink-tinted inset glow. On scroll past 20px, the background darkens to `rgba(11,9,10,0.9)`. Left: logo "Sherry**Berries**" — "Sherry" in `Italiana` font, "Berries" in italic `Playfair Display` colored hot pink `#ff4fa3`. Middle: 5 uppercase nav links (Shop, Bestsellers, Our Story, Learn, Community) — 12px Inter, 0.12em letter-spacing, with an underline animation that scales from 0 to 100% on hover. Right: theme toggle (sun/moon), search, account, wishlist (with count badge), and a **Bag** pill in a hot-pink-to-deep-pink linear gradient with cart count. Hide nav links and collapse the Bag pill to icon-only below 980px.

### Key CSS classes
- `.nav` — fixed positioning container
- `.nav-row` — the actual pill (background, border, blur)
- `.logo` — display font with pink italic accent
- `.nav-links` — flex row of links
- `.icon-btn` — 38×38 circular icon button
- `.cart-pill` — the gradient bag button

---