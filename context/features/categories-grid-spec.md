## 3. Categories Grid

An 8-card grid of category cards, each with a full-bleed image, category number/pin, title, description, and "Shop now" arrow CTA. 4 columns on desktop, 2 on tablet, 1 on mobile.

### Recreation prompt
> Build a category grid section titled "Shop the collection / Find your **signature** piece." with 8 cards in a 4-column responsive grid (4→2→1 cols). Each card is 3:4 aspect ratio, 22px border-radius, background image filling the card with a dark linear-gradient overlay at the bottom (`linear-gradient(180deg, transparent 30%, rgba(13,13,13,0.95) 100%)`). At the top: category number in pink (e.g., "01"); for featured categories ("Bestseller", "New", "Limited"), add a small gold pill in the top-right. At the bottom-left over the gradient: 26px Italiana title, 13px description in muted text, and a small "Shop now →" arrow link in blush pink with a 16px letter-spacing uppercase style. On hover: card lifts 6px, border switches to hot pink, the image scales 1.06×, a radial pink glow appears top-right, and the arrow gap widens. Categories: Belly Rings, Nose Rings, Tragus, Septum Jewelry, Merchandise, Aftercare, Accessories, Waistbeads.


### Skeleton
```html
<a href="#" class="cat">
  <div class="ph"><img src="..." alt=""/></div>
  <span class="cat-num">01</span>
  <span class="cat-pin">Bestseller</span> <!-- optional -->
  <h3 class="cat-title">Belly Rings</h3>
  <p class="cat-desc">Curved barbells, dangles &amp; opals</p>
  <span class="cat-arrow">Shop now →</span>
</a>
```


### Images
 - @assets/images/accessories.jpg - Accessories
 - @assets/images/waistbead.jpg - Waistbeads
 - @assets/images/nosering.jpg - Nose Rings
 - @assets/images/merchandise.jpg - Merchandise
 - @assets/images/aftercare.jpg - Aftercare
 - @assets/images/tragus.jpg - Tragus
 - @assets/images/septum.jpg - Septum Jewelry
