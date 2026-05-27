# Seed Spec

Generate a single Prisma seed.ts file for the SherryBerries ecommerce platform.

Requirements:

- Use Prisma ORM
- Use PostgreSQL
- Use Faker.js
- Use TypeScript
- Everything must exist in ONE seed.ts file

Seed the following models in order:

1. Users
2. Addresses
3. Categories
4. Product Tags
5. Products
6. Product Images
7. Product Variants
8. Blogs
9. Discount Codes
10. Carts
11. Cart Items
12. Wishlists
13. Reviews
14. Orders
15. Order Items
16. Newsletter Subscribers

Generate:

- 25 to 100 users
- 40 to 80 products
- 50 to 200 orders
- 5 to 10 blogs
- 50 to 500 newsletter subscribers

Category Requirements:

- Belly Rings
- Nose Rings
- Septum Jewelry
- Cartilage Jewelry
- Aftercare
- Elixirs
- Accessories
- Merch

Product Rules:

- realistic pricing
- realistic inventory
- unique SKU
- slug
- SEO metadata
- images
- variants where applicable

Pricing Ranges:

- Jewelry: 25 to 180 TTD
- Aftercare: 40 to 120 TTD
- Elixirs: 80 to 180 TTD

Order Rules:

- realistic statuses
- realistic timestamps
- 1 to 5 items per order
- preserve pricing snapshots

Review Rules:

- ratings between 3 and 5
- realistic comments
- mix approved and pending

Wishlist Rules:

- no duplicate product combinations

Cart Rules:

- one active cart per user

Seed realistic Trinidad and Tobago themed ecommerce data.

Ensure all relational integrity is preserved.

Use idempotent logic where appropriate.