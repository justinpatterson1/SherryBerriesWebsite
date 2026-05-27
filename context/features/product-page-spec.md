# SherryBerries Product Detail Page PRD

## Product Requirements Document

Based on:

* Existing PDP implementation prompt
* Prisma database schema
* SherryBerries luxury body jewelry brand architecture

---

# Overview

Build a luxury Product Detail Page (PDP) for the SherryBerries ecommerce platform that integrates seamlessly with the Prisma/Postgres backend and supports:

* Dynamic product rendering
* Variant selection
* Cart functionality
* Wishlist functionality
* Reviews
* Related products
* Theme persistence
* Mobile responsiveness
* Session/cart persistence
* NextAuth authentication support

The PDP must visually match the existing SherryBerries aesthetic:

* Dark feminine luxury
* Pink/black color palette
* Glassmorphism
* Elegant typography
* Premium interactions
* Soft glowing UI elements

---

# Objectives

## Primary Objectives

* Display dynamic product data from Prisma
* Support multiple product variants
* Allow adding products to cart
* Allow wishlist management
* Render verified reviews
* Display related products
* Maintain consistent brand aesthetic

## Secondary Objectives

* Increase conversion rates
* Improve mobile shopping UX
* Support SEO optimization
* Prepare for scaling and future ecommerce features

---

# Tech Stack

| Layer     | Technology                      |
| --------- | ------------------------------- |
| Framework | Next.js 16                      |
| ORM       | Prisma                          |
| Database  | PostgreSQL                      |
| Auth      | NextAuth v5                     |
| Styling   | Tailwind + CSS Variables        |
| Storage   | sessionStorage + DB persistence |
| State     | Context or Zustand              |
| Images    | next/image                      |

---

# Relevant Prisma Models

The Product Detail Page integrates with the following Prisma models:

* Product
* ProductImage
* ProductVariant
* Category
* Review
* Wishlist
* Cart
* CartItem
* ProductTag
* User

---

# Route Structure

## Dynamic Product Route

```text
/products/[slug]
```

Example:

```text
/products/berry-glow-belly-curve
```

---

# Product Fetching Requirements

## Prisma Query

```ts
prisma.product.findUnique({
  where: {
    slug
  },
  include: {
    images: true,
    variants: true,
    category: true,
    reviews: {
      where: {
        approved: true
      },
      include: {
        user: true
      }
    },
    tags: true
  }
})
```

---

# Product Page Architecture

---

# Shared Chrome

The PDP must reuse the exact chrome from the landing page.

## Includes

* Floating glass navbar
* Theme toggle
* Search icon
* Account link
* Wishlist badge
* Cart badge
* Cart drawer
* WhatsApp FAB
* Toast notifications

---

# Theme System

## Requirements

* Persist via localStorage
* Apply before paint
* Support light and dark mode
* Use existing CSS custom properties

## Storage Key

```ts
localStorage["sb-theme"]
```

## Theme Attribute

```html
<html data-theme="dark">
```

---

# Navbar Requirements

## Layout

### Left

* SherryBerries logo

### Center

* Shop
* Bestsellers
* Our Story
* Learn
* Community

### Right

* Theme toggle
* Search
* Account
* Wishlist
* Bag button

---

# Breadcrumb Section

## Dynamic Structure

```text
Home / Category / Jewelry Type / Product Name
```

## Database Mapping

| UI           | Database              |
| ------------ | --------------------- |
| Category     | Product.category.name |
| Jewelry Type | Product.jewelryType   |
| Product Name | Product.name          |

---

# Product Hero Layout

## Grid

Desktop:

```css
1.15fr 1fr
```

Mobile:

* Stack vertically below 960px

---

# Product Gallery

## Database Source

```ts
Product.images[]
```

## Requirements

* Thumbnail strip
* Main image
* Fade transitions
* Hover zoom
* Bestseller pill
* Zoom hint pill
* Mobile horizontal thumbnail scrolling

## Image Fields

| Field    | Source                |
| -------- | --------------------- |
| imageUrl | ProductImage.imageUrl |
| altText  | ProductImage.altText  |
| position | ProductImage.position |

---

# Gallery Interactions

## Thumbnail Switching

* 200ms fade transition
* Active thumbnail glow state

## Hover Zoom

* Track mouse movement
* Dynamic transform-origin
* Scale image to 1.6x
* Reset on mouseleave

---

# Product Information

## Core Product Fields

| UI Element        | Database Source          |
| ----------------- | ------------------------ |
| Product Name      | Product.name             |
| Short Description | Product.shortDescription |
| Full Description  | Product.description      |
| Price             | Product.price            |
| Compare Price     | Product.compareAtPrice   |
| Material          | Product.material         |
| Jewelry Type      | Product.jewelryType      |

---

# Typography Requirements

## Product Title

* 52px Italiana
* Secondary line italic Playfair

## Description

* 17px italic Playfair

## Pricing

* Playfair Display
* Elegant luxury spacing

---

# Variant System

## Database Model

```prisma
model ProductVariant {
  id              String
  productId       String
  name            String
  value           String
  sku             String
  inventory       Int
  additionalPrice Decimal?
}
```

---

# Recommended Variant Upgrade

Current schema is functional but should be enhanced.

## Recommended Structure

```prisma
model ProductVariant {
  id              String
  productId       String

  group           String
  value           String

  sku             String
  inventory       Int
  additionalPrice Decimal?
}
```

---

# Supported Variant Types

* Material
* Length
* Stone
* Gauge
* Color

---

# Variant Chip Requirements

## States

### Default

* Subtle border

### Hover

* Border changes to blush

### Active

* Inverted colors
* Elevated appearance

### Disabled

* 40% opacity
* Line-through
* No interaction

---

# Inventory Logic

Disable chips when:

```ts
variant.inventory <= 0
```

---

# Pricing Logic

## Formula

```ts
finalPrice =
product.price + selectedVariant.additionalPrice
```

---

# Quantity Selector

## Rules

* Minimum: 1
* Maximum: 10
* Live pricing updates

---

# Add To Cart System

## Database Models

* Cart
* CartItem

---

# Guest Cart

Persist via:

```ts
sessionStorage
```

---

# Authenticated Cart

Persist via database.

---

# Cart Item Structure

```ts
{
  productId,
  variantId,
  quantity
}
```

---

# Add To Cart Behavior

## Requirements

* Add item
* Increment quantity if existing
* Persist cart
* Update drawer
* Trigger toast

## Toast Example

```text
Berry Glow Belly Curve added to bag ✦
```

---

# Wishlist System

## Database Model

```prisma
Wishlist
```

---

# Wishlist Requirements

* Toggle wishlist state
* Sync nav badge
* Persist for logged-in users
* Persist locally for guests

---

# Product Trust Badges

Static informational section.

## Includes

* Free shipping
* Hypoallergenic
* Returns

---

# Accordion System

## Sections

1. Description
2. Specifications
3. Sizing & Fit
4. Care & Cleaning
5. Shipping & Returns

---

# Accordion Behavior

* First item open by default
* Clicking closes siblings only
* Smooth max-height animation
* Rotating icon animation

---

# Specifications Grid

## Dynamic Data Mapping

| Spec         | Source              |
| ------------ | ------------------- |
| Material     | Product.material    |
| Jewelry Type | Product.jewelryType |
| SKU          | Product.sku         |
| Inventory    | Product.inventory   |

---

# Reviews System

## Database Model

```prisma
Review
```

---

# Review Query

```ts
reviews: {
  where: {
    approved: true
  },
  include: {
    user: true
  }
}
```

---

# Review Requirements

* Verified badge
* Review breakdown bars
* Average rating
* Review count
* Review cards
* Optional photos
* Helpful count

---

# Review Statistics

## Computed Values

| Value          | Computation        |
| -------------- | ------------------ |
| Average Rating | AVG(review.rating) |
| Total Reviews  | COUNT(*)           |
| Breakdown      | GROUP BY rating    |

---

# Recommended Review Enhancement

Add review photos.

## Suggested Schema

```prisma
model ReviewImage {
  id        String @id @default(cuid())
  reviewId  String
  imageUrl  String

  review Review @relation(fields: [reviewId], references: [id])
}
```

---

# Related Products

## Requirements

Display:

* Same category
* Same jewelry type
* Featured products

Exclude current product.

---

# Related Products Query

```ts
prisma.product.findMany({
  where: {
    id: {
      not: currentProduct.id
    },
    OR: [
      {
        categoryId: currentProduct.categoryId
      },
      {
        jewelryType: currentProduct.jewelryType
      }
    ],
    active: true
  },
  take: 4
})
```

---

# SEO Requirements

## Dynamic Metadata

| Field       | Source                 |
| ----------- | ---------------------- |
| Title       | Product.seoTitle       |
| Description | Product.seoDescription |
| OG Image    | First product image    |

Fallbacks:

```ts
seoTitle || name
seoDescription || shortDescription
```

---

# Inventory Status Logic

## In Stock

```ts
inventory > lowStockThreshold
```

## Low Stock

```ts
inventory <= lowStockThreshold
```

## Out Of Stock

```ts
inventory <= 0
```

---

# Mobile Requirements

## Sticky Add-To-Bag Bar

Show when:

* Main CTA leaves viewport
* Screen width < 880px

---

# Animation Requirements

## Fade-Up Observer

Elements with:

```css
.fade-up
```

gain:

```css
.in
```

when intersecting viewport.

---

# Accessibility Requirements

## Requirements

* Keyboard navigation
* Proper ARIA labels
* Focus states
* Accessible accordion behavior
* Semantic buttons

---

# Performance Requirements

## Requirements

* Use next/image
* Lazy load review images
* Minimize hydration
* Prefer server components
* Optimize image loading

---

# Recommended Folder Structure

```text
src/
├── app/
│   └── products/
│       └── [slug]/
│           ├── page.tsx
│           ├── loading.tsx
│           └── error.tsx
│
├── components/
│   └── product/
│       ├── product-gallery.tsx
│       ├── product-info.tsx
│       ├── variant-picker.tsx
│       ├── add-to-cart.tsx
│       ├── product-reviews.tsx
│       ├── related-products.tsx
│       └── accordion.tsx
│
├── lib/
│   ├── cart/
│   ├── wishlist/
│   └── products/
```

---

# API Requirements

## Add To Cart

```text
POST /api/cart
```

---

## Wishlist Toggle

```text
POST /api/wishlist
```

---

## Submit Review

```text
POST /api/reviews
```

---

# Future Enhancements

## Planned Features

* Product video support
* Recently viewed products
* AI sizing suggestions
* Product bundles
* Upsells
* Loyalty rewards
* Dynamic shipping estimates
* Klarna/Afterpay
* Social proof notifications

---

# Success Criteria

The PDP is complete when:

* Product data renders dynamically
* Variants function correctly
* Cart persistence works
* Wishlist syncing works
* Reviews render dynamically
* Related products populate correctly
* Mobile UX is polished
* Theme persistence works
* SEO metadata renders correctly
* Inventory logic functions properly
* The experience visually matches the SherryBerries brand
