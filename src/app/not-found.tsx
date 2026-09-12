"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Nobody should ever sit on a dead end here. This catches both unmatched URLs
// and `notFound()` calls inside a segment, then sends the visitor to the
// section they were already in (/products/bad-slug -> /products) or, when the
// path belongs to no section we serve, home.
//
// Only top-level paths that render a real landing page belong in this list —
// token-gated pages (verify-email, reset-password, unsubscribe) and segments
// with no index page (help, learn, order) would only be another dead end.
const SECTIONS = new Set([
  "account",
  "admin",
  "bestsellers",
  "cart",
  "checkout",
  "contact",
  "login",
  "our-story",
  "privacy",
  "products",
  "terms",
  "wishlist",
]);

function destinationFor(pathname: string) {
  const [section] = pathname.split("/").filter(Boolean);
  return section && SECTIONS.has(section) ? `/${section}` : "/";
}

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();
  const destination = destinationFor(pathname);

  useEffect(() => {
    // `replace` so the browser Back button skips the missing page rather than
    // bouncing the visitor straight back into this redirect.
    router.replace(destination);
  }, [router, destination]);

  return (
    <main className="min-h-[60vh] pt-[120px] px-[8%] flex flex-col items-center justify-center gap-4 text-center max-[600px]:pt-[92px] max-[600px]:px-[6%]">
      <p className="font-sans text-[13px] font-medium tracking-[0.22em] uppercase text-pink m-0">
        Page not found
      </p>
      <p className="font-sans text-[clamp(16px,1.3vw,20px)] leading-[1.8] text-ink-dim m-0">
        Taking you back&hellip;
      </p>
      <Link
        href={destination}
        className="font-sans text-[15px] text-ink no-underline underline-offset-4 hover:text-blush transition-colors"
      >
        Continue now
      </Link>
    </main>
  );
}
