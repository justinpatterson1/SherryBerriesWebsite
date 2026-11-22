import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteNavbar, SiteFooter } from "@/components/layout/site-chrome";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
import { SearchProvider } from "@/components/search/search-provider";
import { IdleSignOut } from "@/components/auth/idle-sign-out";
import { siteUrl } from "@/lib/seo/site-url";
import { ThemeScript } from "@/components/providers/theme-script";
import { SitePopup } from "@/components/popups/site-popup";
import { ChatWidget } from "@/components/chat/chat-widget";
import { SeasonalEffects } from "@/components/seasonal/seasonal-effects";
import { Analytics } from "@vercel/analytics/next";

// Self-hosted (latin subset, variable where the family is) rather than
// next/font/google: Google intermittently serves `/l/font?kit=…` URLs, which
// Turbopack's font loader rejects ("queries have exactly one entry"), failing
// the whole build. Files downloaded from fonts.gstatic.com on 2026-11-15.
const italiana = localFont({
  variable: "--font-italiana",
  src: "./fonts/Italiana-normal.woff2",
  weight: "400",
  display: "swap",
});

const playfair = localFont({
  variable: "--font-playfair",
  src: [
    { path: "./fonts/Playfair-normal.woff2", weight: "400 700", style: "normal" },
    { path: "./fonts/Playfair-italic.woff2", weight: "400 700", style: "italic" },
  ],
  display: "swap",
});

const inter = localFont({
  variable: "--font-inter",
  src: "./fonts/Inter-normal.woff2",
  weight: "300 700",
  display: "swap",
});

const caveat = localFont({
  variable: "--font-caveat",
  src: "./fonts/Caveat-normal.woff2",
  weight: "500 600",
  display: "swap",
});

export const metadata: Metadata = {
  // Without this, every relative OG/Twitter image and canonical URL resolves
  // against the request host — so social previews break and the sitemap's
  // absolute URLs disagree with the page's own canonical. Set from the same
  // helper the sitemap uses, so the two can never drift apart.
  metadataBase: new URL(siteUrl()),
  title: "Body Jewelry and Aftercare in Trinidad & Tobago | SherryBerries",
  description: "Luxury body jewelry and aftercare from Trinidad and Tobago.",
};

// Deliberately NOT set here:
//   - a `title.template`: the pages already end their own titles with
//     "| SherryBerries" (e.g. "Jewelry | SherryBerries"), so a template would
//     render "Jewelry | SherryBerries | SherryBerries".
//   - `alternates.canonical`: metadata is inherited, so a canonical on the root
//     layout would point every page that does not override it at the homepage.
//     Canonicals belong on the individual pages.

// Must be its own export — Next ignores `viewport` inside `metadata` and warns
// on every page that inherits this layout.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      // ThemeScript rewrites data-theme before React hydrates, which React
      // would otherwise report as a server/client mismatch. It is the one
      // attribute we intend to differ.
      suppressHydrationWarning
      className={`${italiana.variable} ${playfair.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <CartProvider>
            <WishlistProvider>
              <IdleSignOut />
              <SearchProvider>
                <SiteNavbar />
                {children}
                <SiteFooter />
                <SitePopup />
                <SeasonalEffects />
                <ChatWidget />
                <Analytics />
              </SearchProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
