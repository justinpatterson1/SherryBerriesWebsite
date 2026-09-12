import "server-only";

/**
 * The canonical origin for everything search engines and social cards see.
 *
 * The apex is canonical; `www` 301-redirects to it in Vercel's domain settings.
 * Keep that in step — a sitemap that advertises a host the site redirects away
 * from makes every entry a redirect hop.
 */
export const CANONICAL_ORIGIN = "https://shopsherryberries.com";

/**
 * Resolve the site's base URL, without a trailing slash.
 *
 * `NEXT_PUBLIC_SITE_URL` is reused rather than introducing a second variable,
 * but it is not trusted blindly: elsewhere in the app it is concatenated
 * (`${baseUrl}/api/...`), so a value missing its scheme silently produces
 * relative URLs. Here a malformed value is rejected outright in favour of the
 * canonical origin, because a sitemap full of `www.example.com/products/x`
 * entries is worse than one built from the hardcoded default.
 *
 * Localhost is deliberately allowed through: `next build` prerenders these
 * routes, and a developer checking /sitemap.xml locally should see their own
 * origin rather than production URLs.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return CANONICAL_ORIGIN;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return CANONICAL_ORIGIN;
    }
    // Origin drops any path, query or trailing slash the value carried.
    return url.origin;
  } catch {
    // No scheme, or otherwise unparseable. `new URL("www.example.com")` throws.
    console.error(
      `[seo] NEXT_PUBLIC_SITE_URL is not an absolute URL (${raw}); falling back to ${CANONICAL_ORIGIN}. It must include https://`,
    );
    return CANONICAL_ORIGIN;
  }
}

/** Join a path onto the base URL without ever producing a doubled slash. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * True on Vercel preview and development deployments.
 *
 * `VERCEL_ENV` is server-side and read at request time, unlike the build-time
 * inlined `NEXT_PUBLIC_*` values. Anything that is not explicitly "production"
 * is treated as non-production, so a new environment is non-indexable by
 * default rather than accidentally indexable.
 */
export function isPreviewDeployment(): boolean {
  const env = process.env.VERCEL_ENV;
  return Boolean(env) && env !== "production";
}
