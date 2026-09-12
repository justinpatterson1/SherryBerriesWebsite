import type { Metadata, Viewport } from "next";
import { Italiana, Playfair_Display, Inter, Caveat } from "next/font/google";
import "./globals.css";
import { SiteNavbar, SiteFooter } from "@/components/layout/site-chrome";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
import { SearchProvider } from "@/components/search/search-provider";
import { IdleSignOut } from "@/components/auth/idle-sign-out";
import { siteUrl } from "@/lib/seo/site-url";

const italiana = Italiana({
  variable: "--font-italiana",
  subsets: ["latin"],
  weight: "400",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  // Without this, every relative OG/Twitter image and canonical URL resolves
  // against the request host — so social previews break and the sitemap's
  // absolute URLs disagree with the page's own canonical. Set from the same
  // helper the sitemap uses, so the two can never drift apart.
  metadataBase: new URL(siteUrl()),
  title: "SherryBerries",
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
      className={`${italiana.variable} ${playfair.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <CartProvider>
            <WishlistProvider>
              <IdleSignOut />
              <SearchProvider>
                <SiteNavbar />
                {children}
                <SiteFooter />
              </SearchProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
