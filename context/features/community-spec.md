## 8. Community / UGC Grid

A 6×N masonry-style Instagram grid with one large hero tile and smaller tiles around it. Hover reveals @handle + likes.

### Recreation prompt
> Build a "Community" section titled "@sherryberries · #sweetberries / Loved by our **sweet berries**." with a 10-tile UGC photo grid arranged in an asymmetric layout. Use CSS Grid with `grid-template-columns: repeat(6, 1fr); grid-auto-rows: 180px;`. The first tile spans `2 cols × 2 rows` (big hero), the next 4 tiles each span 2 cols (1 row tall), then the remaining 5 fill 1×1 cells. Below 1024px: 4-col grid, 160px rows. Below 640px: 2-col grid, 200px rows, with the big tile still 2×2 and others single. Each tile is 16px radius with overflow hidden, a tiny Instagram icon badge in the top-right corner (26×26, semi-transparent dark bg, blush color), and a hover overlay showing the @handle in bold white + "♡ 2.4k likes" in blush pink. On hover, the image inside scales to 1.08× over 0.6s. Use 10 made-up handles like @maya.r, @devon.k, @isabelle_o with cute jewelry-related captions.
