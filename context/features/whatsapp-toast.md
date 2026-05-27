## 12. Floating WhatsApp + Toast Notifications

### WhatsApp FAB recreation prompt
> Build a 56×56 circular floating action button fixed at `bottom: 24px; right: 24px;`. Background is the official WhatsApp green gradient (`linear-gradient(135deg, #25d366, #128c7e)`), with a green glow shadow `0 12px 30px rgba(37, 211, 102, 0.45)`. Inside, a white WhatsApp logo SVG. On hover: lifts 3px, scales 1.05×, glow deepens. Adjacent tooltip to the left (right: 70px), only visible on hover, with text "Need sizing help?" in a small dark pill.

### Toast recreation prompt
> Build a fixed bottom-right toast: `bottom: 96px; right: 24px;` (above the WhatsApp button). Background: `var(--bg-elev-2)`, 1px pink border, 999px radius, padding 12px 22px, 13px text. Hidden by default with `transform: translateX(120%)`; on `.show` class it slides in via `transform: translateX(0)` with a 400ms cubic-bezier curve. Shadow includes a soft pink glow. Auto-dismiss after 2.4s.

---