## Global design tokens

Drop these into your stylesheet first — every component references them.

```css
:root {
  /* Dark theme (default) */
  --bg: #0d0d0d;
  --bg-elev: #161616;
  --bg-elev-2: #1f1c1d;
  --bg-card: #1a1a1a;
  --line: #2a2426;
  --line-strong: #3a3134;
  --line-pink: rgba(255, 79, 163, 0.28);
  --text: #ffffff;
  --text-dim: #cfc6c9;
  --text-faint: #8a8084;
  --blush: #f7b6d2;
  --pink: #ff4fa3;
  --pink-deep: #d63a85;
  --pink-glow: rgba(255, 79, 163, 0.45);
  --gold: #d4af37;
  --gold-soft: #e8c879;

  /* Typography */
  --serif: "Playfair Display", "Times New Roman", serif;
  --display: "Italiana", "Playfair Display", serif;
  --sans: "Inter", system-ui, sans-serif;
  --script: "Caveat", cursive;
}

[data-theme="light"] {
  --bg: #fdf7f4;
  --bg-elev: #ffffff;
  --bg-elev-2: #fbf0ec;
  --bg-card: #ffffff;
  --line: #ecdee2;
  --line-strong: #d9c5cb;
  --text: #1a0d12;
  --text-dim: #5a3f48;
  --text-faint: #998084;
  --blush: #c4286d;
  --pink: #ff4fa3;
  --pink-deep: #b81e62;
  --gold: #9a7b1e;
  --gold-soft: #c69a26;
}
```

**Fonts to load:**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400&family=Italiana&family=Inter:wght@300..700&family=Caveat:wght@500..600&display=swap" rel="stylesheet">
```

---