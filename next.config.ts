import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Allow the storefront's next/image to load photos served from the configured
// R2 public bucket (a custom domain or a pub-xxxx.r2.dev URL). Derived from
// R2_PUBLIC_URL when set; the **.r2.dev wildcard covers the default dev host.
function r2Pattern() {
  const raw = process.env.R2_PUBLIC_URL;
  if (!raw) return [];
  try {
    return [{ protocol: "https" as const, hostname: new URL(raw).hostname }];
  } catch {
    return [];
  }
}

const isDev = process.env.NODE_ENV === "development";

// The Sentry ingest host the browser SDK posts errors and replays to, derived
// from the DSN the same way r2Pattern() derives the bucket host. The wildcards
// are the fallback for builds where the DSN is not present at build time
// (connect-src cannot be widened later — this header is baked in at build).
function sentryConnectSrc() {
  const raw = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (raw) {
    try {
      return [`https://${new URL(raw).hostname}`];
    } catch {
      // fall through to the wildcards
    }
  }
  return [
    "https://*.ingest.sentry.io",
    "https://*.ingest.us.sentry.io",
    "https://*.ingest.de.sentry.io",
  ];
}

// Content Security Policy.
//
// Deliberately NOT nonce-based. Nonces require every page to render dynamically
// (see next/dist/docs/01-app/02-guides/content-security-policy.md), which would
// drop the ~15 prerendered pages this site builds — the whole catalog and every
// legal/help page — and disable ISR. For a storefront with zero
// `dangerouslySetInnerHTML` and no third-party script tags, that trade is not
// worth it. 'unsafe-inline' on script-src is the cost; every other directive is
// closed, which is what stops an injected <img>, <object>, <form> or frame from
// reaching an attacker's origin.
//
// Directive notes:
// - img-src allows any https host: testimonial avatars are intentionally
//   arbitrary remote URLs (see home/testimonials.tsx) and the admin thumbnails
//   and receipt previews use plain <img> with blob: and R2 sources.
// - worker-src blob: is required by Sentry Session Replay's compression worker.
// - form-action stays 'self': the WiPay hand-off is a window.location
//   navigation (checkout-client.tsx), not a cross-origin form post.
// - upgrade-insecure-requests is production-only; it breaks http://localhost.
function cspHeader() {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${sentryConnectSrc().join(" ")}${isDev ? " ws: http://localhost:*" : ""}`,
    "worker-src 'self' blob:",
    "media-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // HSTS is production-only: sent from localhost it would pin http://localhost
  // to https in the browser for two years and break `npm run dev`.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "live.staticflickr.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      ...r2Pattern(),
    ],
  },
  // Hides the framework version from responses; one less fingerprint for an
  // attacker matching a site against a known Next.js CVE.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  // Which Sentry project receives the source maps for this build. Must match the
  // project that issued NEXT_PUBLIC_SENTRY_DSN, so both are set together per
  // deployment environment rather than hardcoded here.
  org: process.env.SENTRY_ORG ?? "jusgadgetz",
  project: process.env.SENTRY_PROJECT ?? "sherryberries-dev",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match src/proxy.ts, otherwise reporting of
  // client-side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
