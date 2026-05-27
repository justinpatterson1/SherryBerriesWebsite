## 11. Cart Drawer (sidebar)

Right-edge slide-in drawer for the shopping bag.

### Recreation prompt
> Build a 420px-wide right-edge slide-in cart drawer (max-width 92vw, full-height). Header: 20×24 padding, "Your Bag" title in 26px Italiana, close ✕ button on the right. Body (flex:1, overflow-y:auto): empty state shows a large pink ♡ icon centered, "Your bag is sweet but empty." subtitle, and a "Start shopping" pink-gradient pill. Items render as 3-column grid: 70px image thumbnail, name+meta+qty-stepper, price. Each qty stepper is a tiny inline-flex with `−` and `+` buttons (22×22 circular). Footer: pinned to bottom, "Subtotal" label and big Playfair price on a row, then a full-width pink gradient "Checkout · Free shipping" CTA, then a tiny "Pay in 4 interest-free installments with Afterpay" caption. The drawer slides in via `transform: translateX(0)` from `translateX(100%)` over 400ms with a backdrop scrim that fades in at 50% opacity with a 4px blur.

---