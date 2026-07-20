import type { NextConfig } from "next";

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
      { protocol: "https", hostname: "live.staticflickr.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      ...r2Pattern(),
    ],
  },
};

export default nextConfig;
