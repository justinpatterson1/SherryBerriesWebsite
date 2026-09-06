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
