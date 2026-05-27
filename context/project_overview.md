# SherryBerries Project Overview

## Project Name

SherryBerries Ecommerce Platform

---

# Project Vision

SherryBerries is a modern feminine ecommerce brand focused on:

* Luxury body jewelry
* Piercing aftercare
* Premium healing products
* Self expression
* Confidence and feminine lifestyle branding

The goal is to create a visually immersive ecommerce experience that feels like a hybrid between:

* Luxury skincare brands
* Modern jewelry boutiques
* Fashion-forward lifestyle brands
* Premium piercing studios

The platform should prioritize:

* aesthetics
* emotional connection
* trust
* education
* conversion
* mobile-first usability

---

# Brand Identity

## Brand Personality

* Feminine
* Luxurious
* Soft glam
* Confident
* Playful but mature
* Warm and community-driven
* High-end but approachable

---

# Color Palette

## Primary Colors

* Matte Black: `#0D0D0D`
* Charcoal: `#1A1A1A`
* Soft Pink: `#F7B6D2`
* Hot Pink Accent: `#FF4FA3`

## Secondary Colors

* Muted Rose: `#D98BA6`
* Metallic Gold: `#D4AF37`
* White: `#FFFFFF`

---

# Typography Direction

## Headings

Elegant bold typography with luxury beauty-brand feel.

Suggested Fonts:

* Playfair Display
* Bodoni Moda
* Cormorant Garamond

## Body Text

Clean modern sans-serif.

Suggested Fonts:

* Inter
* Poppins
* Manrope

---

# Core Business Goals

## Primary Goals

* Sell body jewelry online
* Sell piercing aftercare products
* Build brand trust
* Increase repeat customers
* Establish strong feminine branding
* Build a loyal community

## Secondary Goals

* Educational authority in piercing care
* Build email/SMS marketing list
* Increase social media engagement
* Create a recognizable Caribbean luxury brand

---

# Target Audience

## Primary Audience

Women ages 16-35 interested in:

* Piercings
* Fashion
* Beauty
* Self care
* Feminine aesthetics
* Jewelry
* Alternative fashion

## Customer Characteristics

* Heavy social media users
* Mobile-first shoppers
* Influenced by TikTok and Instagram
* Value aesthetics and branding
* Interested in self expression

---

# Technical Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

## Backend / CMS

* Strapi v5 OR Supabase

## Database

* PostgreSQL

## Media Hosting

* Cloudinary

## Payments

* WiPay
* Stripe (future)

## Deployment

* Vercel (frontend)
* Render or Railway (backend)

---

# Design System Requirements

## UI Style

* Glassmorphism
* Soft gradients
* Layered shadows
* Rounded corners
* Smooth transitions
* Luxury ecommerce aesthetics

## Interaction Design

* Smooth hover states
* Animated buttons
* Cart drawer
* Sticky navigation
* Floating WhatsApp support button

---

# Homepage Structure

## 1. Hero Section

Purpose:

* Immediately communicate branding
* Create emotional impact
* Push users toward shopping

Includes:

* Hero image/video
* Main CTA buttons
* Promotional messaging

---

## 2. Featured Categories

Purpose:

* Improve discoverability
* Guide users to collections

Includes:

* Belly Rings
* Nose Rings
* Cartilage Jewelry
* Titanium Collection
* Aftercare
* Healing Essentials

---

## 3. Best Sellers

Purpose:

* Increase conversions
* Highlight trending items

Includes:

* Product cards
* Reviews
* Material tags
* Quick add functionality

---

## 4. Brand Story

Purpose:

* Build emotional connection
* Increase trust

Includes:

* Founder story
* Lifestyle imagery
* Packaging visuals

---

## 5. Educational Section

Purpose:

* Improve SEO
* Build authority
* Reduce customer confusion

Topics:

* Piercing care
* Healing stages
* Jewelry materials
* Irritation prevention
* Sizing guides

---

## 6. Elixir / Aftercare Highlight

Purpose:

* Position aftercare as premium skincare
* Differentiate from competitors

Includes:

* Product showcase
* Ingredient highlights
* Educational content

---

## 7. Social Proof Section

Purpose:

* Increase trust
* Increase conversions

Includes:

* Customer reviews
* TikTok embeds
* User-generated content
* Instagram gallery

---

## 8. Email Signup

Purpose:

* Build marketing list
* Increase repeat purchases

Offer Examples:

* First order discount
* Jewelry care guide
* Early access drops

---

# Core Features

## Ecommerce Features

* Product catalog
* Product variants
* Cart system
* Wishlist
* Checkout flow
* Coupon support

## User Features

* User accounts
* Order tracking
* Saved wishlist
* Purchase history

## Admin Features

* Product management
* Inventory management
* Order management
* Discount management
* Analytics dashboard

---

# SEO Strategy

## Focus Areas

* Piercing care blogs
* Jewelry education
* Healing guides
* Product optimization
* TikTok-friendly content pages

## Technical SEO

* Dynamic metadata
* Structured data
* OpenGraph support
* Sitemap generation

---

# Mobile Experience Requirements

The mobile experience is the highest priority.

The UI should feel:

* smooth
* premium
* fast
* social-media inspired

Important:

* fast loading
* thumb-friendly navigation
* optimized image loading
* responsive product cards

---

# Future Expansion Ideas

## Phase 2 Features

* Jewelry quiz
* AI jewelry recommendations
* Loyalty system
* Subscription aftercare kits
* Creator affiliate program
* Appointment booking
* Piercing studio locator

---

# Folder Structure Recommendation

/app
/components
/ui
/layout
/home
/product
/cart
/checkout
/account

/lib
/services
/hooks
/utils

/types

/styles

/public

---

# Suggested Component Breakdown

## Shared Components

* Navbar
* Footer
* Buttons
* ProductCard
* SectionHeading
* Carousel
* Modal
* Drawer
* FloatingWhatsApp

## Homepage Components

* HeroSection
* FeaturedCategories
* BestSellers
* BrandStory
* EducationalSection
* ElixirHighlight
* Testimonials
* EmailSignup

---

# Performance Goals

## Lighthouse Targets

* Performance: 90+
* Accessibility: 95+
* SEO: 95+

## Optimization Priorities

* Image optimization
* Lazy loading
* Dynamic imports
* Server-side rendering
* Minimal layout shift

---

# Brand Experience Goals

The site should make users feel:

* confident
* feminine
* stylish
* safe purchasing jewelry
* emotionally connected to the brand

The experience should feel more like entering a luxury beauty brand than a standard jewelry store.

---

# Development Priorities

## Phase 1

* Homepage
* Product listing
* Product detail pages
* Cart
* Checkout

## Phase 2

* Authentication
* Wishlist
* Reviews
* CMS integration

## Phase 3

* Educational blog
* Loyalty features
* AI recommendations
* Marketing automation

---

# Final Creative Direction

The final product should feel like:

* premium
* modern
* emotionally branded
* highly aesthetic
* conversion optimized
* feminine luxury ecommerce

The website should stand out visually while remaining highly usable and scalable.


# Database Architecture Overview

The SherryBerries platform will use:

* Neon PostgreSQL
* Prisma ORM
* PostgreSQL
* TypeScript
* Next.js

The database architecture is designed for:

* scalability
* ecommerce flexibility
* content management
* educational features
* future subscriptions
* loyalty systems
* AI recommendations
* analytics

---

# Prisma Database Models

## User Model

Purpose:
Stores customer and admin account information.

```prisma id="user-model"
model User {
  id            String      @id @default(cuid())
  firstName     String
  lastName      String
  email         String      @unique
  password      String?
  phoneNumber   String?
  role          UserRole    @default(CUSTOMER)

  avatarUrl     String?

  emailVerified Boolean     @default(false)

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  addresses     Address[]
  orders        Order[]
  reviews       Review[]
  wishlistItems Wishlist[]
  cart          Cart?
}
```

---

# User Roles

```prisma id="user-role-enum"
enum UserRole {
  CUSTOMER
  ADMIN
  SUPERADMIN
}
```

---

# Address Model

Purpose:
Stores customer shipping and billing addresses.

```prisma id="address-model"
model Address {
  id            String   @id @default(cuid())

  userId        String
  user          User     @relation(fields: [userId], references: [id])

  fullName      String
  phoneNumber   String

  addressLine1  String
  addressLine2  String?

  city          String
  region        String
  postalCode    String?
  country       String

  isDefault     Boolean  @default(false)

  createdAt     DateTime @default(now())
}
```

---

# Product Model

Purpose:
Core ecommerce product model.

```prisma id="product-model"
model Product {
  id                String            @id @default(cuid())

  name              String
  slug              String            @unique

  shortDescription  String
  description       String            @db.Text

  sku               String            @unique

  price             Decimal           @db.Decimal(10,2)
  compareAtPrice    Decimal?          @db.Decimal(10,2)

  inventory         Int               @default(0)

  featured          Boolean           @default(false)
  active            Boolean           @default(true)

  material          String?
  jewelryType       JewelryType

  healingStage      HealingStage?

  seoTitle          String?
  seoDescription    String?

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  categoryId        String
  category          Category          @relation(fields: [categoryId], references: [id])

  images            ProductImage[]
  variants          ProductVariant[]
  reviews           Review[]
  wishlistItems     Wishlist[]
  orderItems        OrderItem[]

  tags              ProductTag[]
}
```

---

# Jewelry Type Enum

```prisma id="jewelry-type-enum"
enum JewelryType {
  BELLY_RING
  NOSE_RING
  SEPTUM
  CARTILAGE
  NIPPLE
  EAR_LOBE
  INDUSTRIAL
  LABRET
  AFTERCARE
  ELIXIR
}
```

---

# Healing Stage Enum

```prisma id="healing-stage-enum"
enum HealingStage {
  FRESH_PIERCING
  HEALING
  HEALED
}
```

---

# Category Model

Purpose:
Groups products into collections.

```prisma id="category-model"
model Category {
  id              String      @id @default(cuid())

  name            String
  slug            String      @unique

  description     String?

  imageUrl        String?

  seoTitle        String?
  seoDescription  String?

  createdAt       DateTime    @default(now())

  products        Product[]
}
```

---

# Product Image Model

Purpose:
Supports multiple product images.

```prisma id="product-image-model"
model ProductImage {
  id          String    @id @default(cuid())

  productId   String
  product     Product   @relation(fields: [productId], references: [id])

  imageUrl    String
  altText     String?

  position    Int       @default(0)

  createdAt   DateTime  @default(now())
}
```

---

# Product Variant Model

Purpose:
Handles sizes, colors, materials, etc.

```prisma id="product-variant-model"
model ProductVariant {
  id              String     @id @default(cuid())

  productId       String
  product         Product    @relation(fields: [productId], references: [id])

  name            String
  value           String

  sku             String     @unique

  inventory       Int        @default(0)

  additionalPrice Decimal?   @db.Decimal(10,2)

  createdAt       DateTime   @default(now())
}
```

---

# Product Tag Model

Purpose:
Flexible filtering and search tags.

```prisma id="product-tag-model"
model ProductTag {
  id          String     @id @default(cuid())

  name        String     @unique

  products    Product[]
}
```

---

# Cart Model

Purpose:
Stores active shopping carts.

```prisma id="cart-model"
model Cart {
  id            String      @id @default(cuid())

  userId        String?     @unique
  user          User?       @relation(fields: [userId], references: [id])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  cartItems     CartItem[]
}
```

---

# Cart Item Model

```prisma id="cart-item-model"
model CartItem {
  id              String           @id @default(cuid())

  cartId          String
  cart            Cart             @relation(fields: [cartId], references: [id])

  productId       String
  product         Product          @relation(fields: [productId], references: [id])

  quantity        Int              @default(1)

  variantId       String?
  variant         ProductVariant?  @relation(fields: [variantId], references: [id])

  createdAt       DateTime         @default(now())
}
```

---

# Order Model

Purpose:
Stores completed purchases.

```prisma id="order-model"
model Order {
  id                  String            @id @default(cuid())

  userId              String
  user                User              @relation(fields: [userId], references: [id])

  orderNumber         String            @unique

  subtotal            Decimal           @db.Decimal(10,2)
  shippingCost        Decimal           @db.Decimal(10,2)
  total               Decimal           @db.Decimal(10,2)

  paymentStatus       PaymentStatus     @default(PENDING)
  fulfillmentStatus   FulfillmentStatus @default(UNFULFILLED)

  paymentMethod       String?

  trackingNumber      String?

  notes               String?

  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  orderItems          OrderItem[]
}
```

---

# Payment Status Enum

```prisma id="payment-status-enum"
enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}
```

---

# Fulfillment Status Enum

```prisma id="fulfillment-status-enum"
enum FulfillmentStatus {
  UNFULFILLED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

---

# Order Item Model

```prisma id="order-item-model"
model OrderItem {
  id              String           @id @default(cuid())

  orderId         String
  order           Order            @relation(fields: [orderId], references: [id])

  productId       String
  product         Product          @relation(fields: [productId], references: [id])

  variantId       String?
  variant         ProductVariant?  @relation(fields: [variantId], references: [id])

  quantity        Int

  price           Decimal          @db.Decimal(10,2)
}
```

---

# Review Model

Purpose:
Customer product reviews.

```prisma id="review-model"
model Review {
  id            String      @id @default(cuid())

  userId        String
  user          User        @relation(fields: [userId], references: [id])

  productId     String
  product       Product     @relation(fields: [productId], references: [id])

  rating        Int

  title         String?
  comment       String      @db.Text

  approved      Boolean     @default(false)

  createdAt     DateTime    @default(now())
}
```

---

# Wishlist Model

Purpose:
Saved products.

```prisma id="wishlist-model"
model Wishlist {
  id            String      @id @default(cuid())

  userId        String
  user          User        @relation(fields: [userId], references: [id])

  productId     String
  product       Product     @relation(fields: [productId], references: [id])

  createdAt     DateTime    @default(now())

  @@unique([userId, productId])
}
```

---

# Blog Model

Purpose:
Educational SEO content.

```prisma id="blog-model"
model Blog {
  id                String      @id @default(cuid())

  title             String
  slug              String      @unique

  excerpt           String?
  content           String      @db.Text

  featuredImage     String?

  published         Boolean     @default(false)

  seoTitle          String?
  seoDescription    String?

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

---

# Newsletter Subscriber Model

Purpose:
Email marketing list.

```prisma id="newsletter-model"
model NewsletterSubscriber {
  id            String      @id @default(cuid())

  email         String      @unique

  subscribedAt  DateTime    @default(now())
}
```

---

# Discount Code Model

Purpose:
Promotions and coupons.

```prisma id="discount-model"
model DiscountCode {
  id              String      @id @default(cuid())

  code            String      @unique

  percentageOff   Int?
  amountOff       Decimal?    @db.Decimal(10,2)

  active          Boolean     @default(true)

  usageLimit      Int?
  timesUsed       Int         @default(0)

  expiresAt       DateTime?

  createdAt       DateTime    @default(now())
}
```

---

# Analytics Considerations

Future analytics can track:

* best sellers
* conversion rates
* abandoned carts
* repeat customers
* customer lifetime value
* top viewed products
* popular categories

---

# Future Expansion Models

Potential future additions:

* LoyaltyProgram
* ReferralCode
* SubscriptionBox
* AppointmentBooking
* InfluencerProgram
* RewardsPoints
* AIRecommendations

---

# Recommended Prisma Features

## Enable Prisma Accelerate

Improves performance for serverless environments.

## Enable Prisma Optimize

Improves query efficiency and debugging.

---

# Suggested Prisma Commands

```bash id="generate-prisma"
npx prisma generate
```

```bash id="migrate-prisma"
npx prisma migrate dev
```

```bash id="open-prisma-studio"
npx prisma studio
```

---

# Final Database Architecture Goals

The database should support:

* high scalability
* modern ecommerce functionality
* educational content
* strong SEO structure
* premium customer experience
* future growth into a larger feminine lifestyle brand ecosystem

