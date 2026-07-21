import Link from "next/link";

const SHOP = [
  { label: "Belly Rings", href: "/products?category=belly-rings" },
  { label: "Nose Rings", href: "/products?category=nose-rings" },
  { label: "Cartilage", href: "/products?category=tragus" },
  { label: "Septum", href: "/products?category=septum" },
  { label: "Waistbeads", href: "/products?category=waistbeads" },
];

const CARE = [
  { label: "Aftercare Shop", href: "/products?category=aftercare" },
  { label: "Healing Guide", href: "/aftercare-guide" },
  { label: "Materials Glossary", href: "/learn/materials" },
  { label: "Sizing Guide", href: "/learn/sizing" },
];

const HELP = [
  { label: "Contact", href: "/contact" },
  { label: "Shipping", href: "/help/shipping" },
  { label: "Returns", href: "/help/returns" },
  { label: "Order Status", href: "/account/orders" },
  { label: "FAQ", href: "/#faq" },
];

const FOLLOW = [
  { label: "Instagram", href: "https://www.instagram.com/sherryberries_/" },
  { label: "TikTok", href: "https://www.tiktok.com/@sherrybvanessa?lang=en" },
];

export function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/[0.06] px-[8%] pt-20 pb-8 text-ink-dim font-sans light:bg-[#1a0d12] light:text-[#cfc6c9] light:border-white/[0.05]">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-14 max-[980px]:grid-cols-2 max-[980px]:gap-10 max-[560px]:grid-cols-1 max-[560px]:gap-9">
        <div className="flex flex-col gap-5 max-w-[360px] max-[980px]:col-span-full">
          <Link
            href="/"
            className="font-display text-[32px] tracking-[0.02em] text-white no-underline leading-none"
          >
            Sherry<span className="font-serif italic text-pink ml-px">Berries</span>
          </Link>
          <p className="text-base leading-[1.65] text-[#8a8084] m-0 max-w-[340px]">
            Luxury body jewelry &amp; piercing aftercare — made with love in Brooklyn
            &amp; Bridgetown.
          </p>

          <div className="flex gap-2.5">
            <SocialLink href="https://www.instagram.com/sherryberries_/" label="Instagram">
              <InstagramIcon />
            </SocialLink>
            <SocialLink href="https://www.tiktok.com/@sherrybvanessa?lang=en" label="TikTok">
              <TikTokIcon />
            </SocialLink>
            <SocialLink href="https://pinterest.com" label="Pinterest">
              <PinterestIcon />
            </SocialLink>
            <SocialLink href="https://youtube.com" label="YouTube">
              <YouTubeIcon />
            </SocialLink>
          </div>

          <div className="flex flex-wrap gap-1.5" aria-label="Accepted payment methods">
            <PayChip>VISA</PayChip>
            <PayChip>MC</PayChip>
            <PayChip>AMEX</PayChip>
            <PayChip>AFTERPAY</PayChip>
          </div>
        </div>

        <FooterCol title="Shop" links={SHOP} />
        <FooterCol title="Care" links={CARE} />
        <FooterCol title="Help" links={HELP} />
        <FooterCol title="Follow" links={FOLLOW} />
      </div>

      <div className="mt-16 pt-7 border-t border-white/[0.06] flex items-center justify-between gap-4 flex-wrap text-sm text-[#6a6266] max-[560px]:flex-col max-[560px]:items-start">
        <span>
          © 2026 SherryBerries Atelier · Made with{" "}
          <span className="text-pink" aria-hidden="true">♡</span> in Brooklyn &amp;
          Bridgetown
        </span>
        <nav className="flex gap-7 text-sm" aria-label="Legal">
          <Link href="/privacy" className="text-[#8a8084] no-underline transition-colors duration-200 hover:text-blush">
            Privacy
          </Link>
          <Link href="/terms" className="text-[#8a8084] no-underline transition-colors duration-200 hover:text-blush">
            Terms
          </Link>
          <Link href="/accessibility" className="text-[#8a8084] no-underline transition-colors duration-200 hover:text-blush">
            Accessibility
          </Link>
        </nav>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="w-[38px] h-[38px] rounded-full inline-flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-[#cfc6c9] transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:text-white hover:bg-pink/15 hover:border-pink hover:shadow-[0_0_24px_rgba(255,79,163,0.5)] hover:-translate-y-px [&_svg]:w-[17px] [&_svg]:h-[17px]"
    >
      {children}
    </Link>
  );
}

function PayChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold tracking-[0.16em] px-3 py-[7px] rounded-md bg-white/[0.06] text-[#cfc6c9] border border-white/[0.08] leading-none">
      {children}
    </span>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-[13px] font-semibold tracking-[0.18em] uppercase text-blush mt-0 mb-6">
        {title}
      </h4>
      <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
        {links.map((l) => {
          const external = l.href.startsWith("http");
          return (
            <li key={l.href + l.label}>
              <Link
                href={l.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-base text-[#8a8084] no-underline transition-colors duration-200 hover:text-blush"
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3a4.5 4.5 0 0 0 4.5 4.5V10a7 7 0 0 1-4.5-1.6V15a5.5 5.5 0 1 1-5.5-5.5h.5v2.6a3 3 0 1 0 2.5 3V3h2.5z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 17.5 12 9" />
      <path d="M9.5 13.5c.4 1 1.3 1.5 2.3 1.5 2 0 3.7-1.7 3.7-4 0-2.2-1.6-3.6-3.7-3.6-2.5 0-4.3 1.9-4.3 4 0 .9.3 1.7.9 2.3" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  );
}
