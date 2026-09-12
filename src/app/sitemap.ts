import type { MetadataRoute } from "next";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo/site-url";

// Served by Next at /sitemap.xml from this file convention — no library, no
// route handler.
//
// Products come from the database, so the entries change without a deploy.
// Revalidated hourly rather than per request: crawlers fetch this rarely, and
// an hour-old lastModified costs nothing next to a database read on every hit.
export const revalidate = 3600;

/**
 * Public, indexable routes — every one verified to exist under `src/app`.
 *
 * The PRD's examples (/shop, /about, /faq, /aftercare, /returns) are not this
 * codebase's routes and are deliberately absent: it says not to create URLs for
 * routes that do not exist.
 *
 * Everything private, transactional or utility is omitted: /account, /admin,
 * /cart, /checkout, /login, /forgot-password, /reset-password, /verify-email,
 * /unsubscribe, /wishlist, /order/[orderNumber]/payment and all of /api.
 */
const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/bestsellers", changeFrequency: "weekly", priority: 0.8 },
  { path: "/our-story", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/learn/sizing", changeFrequency: "monthly", priority: 0.5 },
  { path: "/help/shipping", changeFrequency: "monthly", priority: 0.4 },
  { path: "/help/returns", changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

// Categories are a filter on /products (`?category=slug`), not routes of their
// own, so they get no entries: the products they filter are each already listed
// individually, and query-string URLs are exactly what a sitemap should omit.

type ProductEntry = { slug: string; updatedAt: Date };

/**
 * Products eligible to be indexed.
 *
 * The filter mirrors the product page's own 404 condition (`!product.active`)
 * so the sitemap can never advertise a URL that returns 404.
 */
async function publicProducts(): Promise<ProductEntry[]> {
  return prisma.product.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No `lastModified` on the static routes. There is no real timestamp for
  // them, and stamping `new Date()` would republish all ten as "changed" on
  // every hourly revalidation — telling crawlers /privacy changes hourly while
  // its own changeFrequency says yearly. An invented lastmod that contradicts
  // itself is worse than none: it is the fastest way to make Google distrust
  // every lastmod in the file. Products keep theirs because updatedAt is real.
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // A database blip must not take the whole sitemap down: the static half is
  // still valid and useful, so it is returned rather than erroring out. The
  // failure is reported — never silently swallowed — and no detail reaches the
  // response body.
  let products: ProductEntry[] = [];
  try {
    products = await publicProducts();
  } catch (error) {
    Sentry.captureException(error);
    console.error("[sitemap] product lookup failed; serving static routes only:", error);
  }

  for (const product of products) {
    entries.push({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // `slug` is unique and the static paths are distinct, so duplicates should be
  // impossible — this guarantees it regardless of how the lists later change.
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
