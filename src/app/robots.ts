import type { MetadataRoute } from "next";
import { absoluteUrl, isPreviewDeployment } from "@/lib/seo/site-url";

// Served by Next at /robots.txt from this file convention.
//
// Read per request rather than baked in, because VERCEL_ENV is what
// distinguishes a preview deployment from production and it is only available
// server-side at runtime.
export const dynamic = "force-dynamic";

/**
 * Paths crawlers have no business in: private, transactional, or one-shot
 * token URLs. Each is a real route under `src/app` — nothing here is blocked
 * speculatively.
 *
 * Note what is NOT blocked: `/_next/` and the R2 image host. Blocking those
 * would stop Google rendering the pages it is allowed to index.
 */
const DISALLOW = [
  "/admin/",
  "/api/",
  "/account/",
  "/checkout/",
  "/cart",
  "/order/",
  "/wishlist",
  "/login",
  "/forgot-password",
  "/reset-password",
  // Token-bearing links that arrive by email. They work once and must never be
  // crawled, cached or indexed.
  "/verify-email",
  "/unsubscribe",
];

export default function robots(): MetadataRoute.Robots {
  // Preview and development deployments are kept out of the index entirely, so
  // a staging copy cannot compete with production for the same content. Guarded
  // on an explicit "production" check, so this can never block the real site.
  if (isPreviewDeployment()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOW,
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
