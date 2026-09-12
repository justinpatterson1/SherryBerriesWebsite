# PRD: Dynamic Sitemap and Robots Configuration

## Project

SherryBerries E-commerce Website

## Objective

Implement a production-ready XML sitemap and robots.txt configuration for the SherryBerries website using the existing Next.js application.

The implementation must use the native Next.js App Router metadata file conventions:

* `app/sitemap.ts`
* `app/robots.ts`

The solution must integrate with the existing project architecture rather than introducing a separate sitemap library unless absolutely necessary.

The production domain is:

`https://shopsherryberries.com`

---

# 1. Preliminary Project Inspection

Before writing any code, inspect the existing codebase.

Determine:

* Next.js version
* Whether the project uses the App Router
* Existing route structure
* Existing product route structure
* Existing category or collection routes
* Prisma schema and database models
* Product model name
* Product slug field
* Product active/published status field
* Product `updatedAt` field, if available
* Existing environment variables for the application's base URL
* Existing SEO or metadata configuration
* Whether `sitemap.ts`, `robots.ts`, `robots.txt`, or sitemap-related functionality already exists

Do not assume field names.

Use the actual Prisma schema and application routes.

If the application's actual structure differs from this PRD, adapt the implementation to the existing architecture while preserving the requirements below.

---

# 2. Sitemap Requirements

Create:

`app/sitemap.ts`

Use the native Next.js type:

```typescript
import type { MetadataRoute } from "next";
```

The sitemap function should return:

```typescript
MetadataRoute.Sitemap
```

or:

```typescript
Promise<MetadataRoute.Sitemap>
```

if database access is required.

The resulting sitemap must automatically be available at:

`/sitemap.xml`

Production URL:

`https://shopsherryberries.com/sitemap.xml`

---

# 3. Base URL

Use:

`https://shopsherryberries.com`

Prefer using an existing production site URL environment variable if the project already has one.

For example:

```typescript
const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://shopsherryberries.com";
```

Do not introduce a duplicate environment variable if an appropriate one already exists.

The sitemap must never generate localhost URLs in production.

Normalize the base URL if necessary to prevent URLs containing duplicate `/` characters.

---

# 4. Static Public Pages

Inspect the application and include legitimate public, indexable pages.

Potential examples include:

* `/`
* `/shop`
* `/about`
* `/contact`
* `/faq`
* `/aftercare`
* `/shipping`
* `/delivery`
* `/pickup`
* `/privacy`
* `/terms`
* `/returns`

These are examples only.

Do not create URLs for routes that do not exist.

Only include real public routes discovered in the application.

---

# 5. Product Pages

The website contains dynamically generated product pages.

Inspect the Prisma schema and existing product routes to determine how products are retrieved.

Retrieve products that are eligible to appear publicly on the website.

Only include products that should be indexed by search engines.

For example, if the database contains an `active`, `published`, `status`, `isActive`, or equivalent field, use the actual field to exclude unpublished products.

Do not guess the field name.

Each product should generate its canonical product URL using the application's existing route structure.

For example, if the existing structure is:

`/products/[slug]`

generate:

```text
https://shopsherryberries.com/products/{slug}
```

If the project uses another structure, use that structure instead.

Use the product's actual slug.

Do not expose database IDs in URLs unless that is already how the application routes products.

---

# 6. Product lastModified

If products contain an `updatedAt` or equivalent timestamp, use it as:

```typescript
lastModified: product.updatedAt
```

This should allow search engines to understand when a product page was last updated.

If the schema does not contain a reliable modification timestamp, do not invent one.

---

# 7. Category and Collection Pages

Inspect the website for public product categories or collections.

Examples may include:

* Belly Rings
* Nose Jewelry
* Nipple Rings
* Septum Jewelry
* Retainers
* Aftercare
* Piercing Tools
* Accessories

If these categories have actual public URLs, include them in the sitemap.

For example:

```text
/shop/belly-rings
/shop/nose-jewelry
/shop/aftercare
```

Do not generate category URLs simply because a category exists in the database.

Only include categories that resolve to real, indexable pages.

If categories are dynamically stored and dynamically routed, generate the sitemap entries from the appropriate database model.

---

# 8. Sitemap Exclusions

Do NOT include private, administrative, authentication, transactional, or utility pages.

Examples include:

```text
/admin
/admin/*
/api/*
/account
/account/*
/login
/register
/checkout
/cart
/orders
/orders/*
/order-confirmation
/reset-password
/forgot-password
```

Inspect the project for similar routes and exclude them.

Also exclude:

* Development-only routes
* Preview routes
* Internal tools
* Webhooks
* Authentication callbacks
* Test pages
* Debugging pages
* Unpublished products
* Unpublished categories
* Search result URLs
* Filter query URLs
* Duplicate URLs

---

# 9. Sitemap Metadata

Use sensible values for `changeFrequency` and `priority`.

Suggested defaults:

### Homepage

```typescript
changeFrequency: "weekly"
priority: 1
```

### Main shop page

```typescript
changeFrequency: "daily"
priority: 0.9
```

### Product pages

```typescript
changeFrequency: "weekly"
priority: 0.8
```

### Category pages

```typescript
changeFrequency: "weekly"
priority: 0.8
```

### About, Contact, FAQ and informational pages

```typescript
changeFrequency: "monthly"
priority: 0.5
```

These values may be adjusted based on the actual purpose of the routes.

Do not give every page a priority of `1`.

---

# 10. robots.ts

Create:

`app/robots.ts`

Use:

```typescript
import type { MetadataRoute } from "next";
```

The function should return:

```typescript
MetadataRoute.Robots
```

The resulting file must automatically be accessible at:

`/robots.txt`

Production URL:

`https://shopsherryberries.com/robots.txt`

---

# 11. Robots Rules

Allow legitimate public pages to be crawled.

Base configuration:

```typescript
rules: {
  userAgent: "*",
  allow: "/",
}
```

Add appropriate `disallow` rules after inspecting the actual application routes.

Likely exclusions include:

```text
/admin/
/api/
/account/
/checkout/
/orders/
```

Do not blindly block routes without checking whether they exist.

Do not block CSS, JavaScript, images, product assets, or other resources required for Google to properly render public pages.

---

# 12. Cart

The cart should not appear in the sitemap.

Determine whether blocking `/cart` in `robots.txt` is appropriate based on how the application handles the cart.

At minimum, ensure `/cart` is not included in `sitemap.xml`.

---

# 13. Sitemap Declaration

`robots.ts` must reference the sitemap:

```typescript
sitemap: `${baseUrl}/sitemap.xml`
```

For production this should resolve to:

`https://shopsherryberries.com/sitemap.xml`

---

# 14. Security Requirements

The sitemap must never expose:

* Admin URLs that should remain private
* Internal API routes
* Database identifiers that are not already public
* Draft products
* Unpublished products
* Customer information
* Order information
* Email addresses
* Authentication URLs containing tokens
* Internal server paths
* Environment variables
* Secrets
* Preview URLs

The sitemap must only contain publicly accessible canonical URLs.

---

# 15. Database Failure Handling

Do not allow an unnecessary temporary database failure to make the entire sitemap endpoint unusable if it can be safely avoided.

Implement sensible error handling around dynamic database entries.

For example:

1. Generate known static URLs.
2. Attempt to retrieve public products.
3. If product retrieval unexpectedly fails, log the error using the project's existing logging approach.
4. Return valid static sitemap entries rather than an invalid response, if appropriate for the existing architecture.

Do not expose database error details to visitors.

Do not silently swallow errors if the project already has a logging system.

---

# 16. Duplicate URLs

Ensure the final sitemap does not contain duplicate URLs.

This is particularly important if routes are generated from multiple sources, such as:

* Static routes
* Database products
* Categories
* Collections

Deduplicate URLs before returning the sitemap if necessary.

---

# 17. Canonical URL Consistency

Inspect the site's existing canonical URL strategy.

The sitemap URLs should match the canonical URLs used by the website.

For example, avoid situations where the sitemap contains:

`/product/item`

while the page canonical URL points to:

`/products/item`

Use one consistent URL structure.

---

# 18. Environment Handling

The production sitemap must contain the production domain.

Development environments should not accidentally be submitted to search engines.

If appropriate for the existing deployment architecture, configure robots behavior so non-production deployments are not indexed.

The site is expected to be deployed using Vercel.

Consider Vercel preview deployments.

If the application can reliably detect a preview deployment, prevent preview deployments from being indexed.

Do not accidentally block the production deployment.

---

# 19. Code Quality

Implementation should:

* Use TypeScript
* Follow existing project conventions
* Avoid unnecessary dependencies
* Avoid `any`
* Avoid hardcoding database data
* Reuse the existing Prisma client
* Reuse existing environment configuration
* Reuse existing logging utilities where appropriate
* Keep functions readable
* Avoid unnecessary abstraction
* Follow Next.js App Router conventions
* Compile successfully under the project's existing TypeScript configuration

---

# 20. Expected Files

At minimum:

```text
app/
├── sitemap.ts
└── robots.ts
```

If the project uses a `src` directory, place them appropriately:

```text
src/app/
├── sitemap.ts
└── robots.ts
```

Determine the correct location from the existing project.

---

# 21. Validation

After implementation, verify that:

```text
/sitemap.xml
```

returns valid XML.

Verify that:

```text
/robots.txt
```

returns valid robots.txt content.

Check that the sitemap contains:

* Homepage
* Shop page, if present
* Public categories
* Active/public products
* Relevant informational pages

Check that it does NOT contain:

* Admin pages
* API routes
* Checkout
* Account pages
* Orders
* Authentication routes
* Draft products
* Unpublished products
* Development pages

---

# 22. Build Validation

Run the project's existing validation commands after implementation.

At minimum, where available:

```bash
npm run lint
npm run build
```

Resolve TypeScript, linting, import, Prisma, or Next.js errors caused by the implementation.

Do not modify unrelated application code simply to make these files compile unless there is a legitimate integration issue.

---

# 23. Expected Final Output

After completing the implementation, provide:

1. The files created or modified.
2. A short explanation of how the sitemap works.
3. A short explanation of how robots.txt works.
4. The public URLs where they will be available.
5. Any routes intentionally excluded.
6. Any assumptions made based on the existing project.
7. Any issues discovered during implementation.
8. Confirmation that the project builds successfully.

Do not only provide example code.

Inspect the project and implement the files directly.

---

# Acceptance Criteria

The task is complete when:

* `sitemap.ts` exists in the correct App Router location.
* `robots.ts` exists in the correct App Router location.
* `/sitemap.xml` is generated by Next.js.
* `/robots.txt` is generated by Next.js.
* The production domain is `https://shopsherryberries.com`.
* Public product pages are dynamically included.
* Only indexable products are included.
* Existing public category pages are included.
* Private and transactional pages are excluded.
* robots.txt references sitemap.xml.
* Production URLs are canonical and consistent.
* Vercel preview deployments are protected from accidental indexing where reliably possible.
* No sensitive data is exposed.
* No unnecessary third-party sitemap package is introduced.
* The implementation uses the existing Prisma/database architecture.
* TypeScript compiles successfully.
* The production build completes successfully.
