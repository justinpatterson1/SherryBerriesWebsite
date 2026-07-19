"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { useSearch } from "@/components/search/search-provider";
import { AuthButton } from "@/components/auth/auth-button";

type NavChild = { label: string; href: string };
type NavItem = { label: string; href: string; children?: NavChild[] };

const NAV_LINKS: NavItem[] = [
  // {
  //   label: "Products",
  //   href: "/products",
  //   children: [
  //     { label: "Jewelry", href: "/products" },
  //     { label: "Aftercare", href: "/products?category=aftercare" },
  //     { label: "Merchandise", href: "/products?category=merch" },
  //   ],
  // },
  
      { label: "Jewelry", href: "/products" },
      { label: "Aftercare", href: "/products?category=aftercare" },
      { label: "Merchandise", href: "/products?category=merch" },
      { label: "Bestsellers", href: "/bestsellers" },
  // { label: "Our Story", href: "/our-story" },
  // { label: "FAQ", href: "/faq" },
  // { label: "Community", href: "/community" },
];

const desktopLinkClass =
  "relative font-sans text-sm font-medium tracking-[0.12em] uppercase text-ink-dim no-underline py-2 " +
  "transition-colors duration-200 hover:text-ink focus-visible:text-ink " +
  "after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-pink " +
  "after:scale-x-0 after:origin-left after:transition-transform after:duration-[260ms] after:ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
  "hover:after:scale-x-100 focus-visible:after:scale-x-100";

const mobileLinkClass =
  "font-sans text-sm font-medium tracking-[0.14em] uppercase text-ink-dim no-underline py-3.5 px-3 rounded-xl " +
  "transition-colors duration-200 hover:text-ink hover:bg-white/5 focus-visible:text-ink focus-visible:bg-white/5 " +
  "light:hover:bg-[rgba(26,13,18,0.05)] light:focus-visible:bg-[rgba(26,13,18,0.05)]";

type Theme = "dark" | "light";

const navRowBase =
  "pointer-events-auto w-fit max-w-[calc(100vw-2rem)] flex items-center gap-7 " +
  "max-[1400px]:gap-5 max-[1280px]:w-full max-[1280px]:justify-between max-[1280px]:gap-3 " +
  "py-[calc(10px+0.5rem)] pl-7 pr-[18px] rounded-full " +
  "max-[1280px]:py-3 max-[1280px]:pl-5 max-[1280px]:pr-3 " +
  "border border-white/[0.06] backdrop-blur-[20px] backdrop-saturate-150 " +
  "shadow-[0_12px_40px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.04)_inset,0_0_0_1px_rgba(255,79,163,0.08)_inset,0_0_60px_rgba(255,79,163,0.08)_inset] " +
  "transition-[background-color,box-shadow] duration-[240ms] " +
  "light:border-[rgba(26,13,18,0.08)] " +
  "light:shadow-[0_12px_40px_rgba(180,120,140,0.18),0_1px_0_rgba(255,255,255,0.6)_inset,0_0_0_1px_rgba(255,79,163,0.1)_inset]";

export function Navbar() {
  const { status } = useSession();
  const showWishlist = status === "authenticated";
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { open: openSearch } = useSearch();
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // While the mobile menu is open: lock body scroll and close on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const rowBgClass = scrolled
    ? "bg-[rgba(11,9,10,0.9)] light:bg-[rgba(253,247,244,0.94)]"
    : "bg-[rgba(15,12,13,0.72)] light:bg-[rgba(253,247,244,0.78)]";

  return (
    <header className="fixed top-[18px] inset-x-0 z-50 flex flex-col items-center pointer-events-none px-4">
      <div className={`${navRowBase} ${rowBgClass}`}>
        <Link
          href="/"
          aria-label="SherryBerries home"
          onClick={() => setMenuOpen(false)}
          className="font-display text-[28px] max-[380px]:text-[22px] tracking-[0.02em] text-ink no-underline leading-none whitespace-nowrap"
        >
          Sherry
          <span className="font-serif italic text-pink ml-px">Berries</span>
        </Link>

        <nav
          aria-label="Primary"
          className="flex items-center gap-7 max-[1400px]:gap-5 ml-2 flex-1 min-w-0 justify-center max-[1280px]:hidden"
        >
          {NAV_LINKS.map((link) =>
            link.children ? (
              <NavDropdown key={link.label} item={link} />
            ) : (
              <Link key={link.href} href={link.href} className={desktopLinkClass}>
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Desktop actions */}
        <div className="flex items-center gap-2 max-[1280px]:hidden">
          <IconButton
            label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </IconButton>

          <IconButton label="Search" onClick={openSearch}>
            <SearchIcon />
          </IconButton>

          <IconLink href="/account" label="Account">
            <UserIcon />
          </IconLink>

          {showWishlist && (
            <IconLink href="/wishlist" label={`Wishlist (${wishlistCount})`}>
              <HeartIcon />
              {wishlistCount > 0 && <CountBadge>{wishlistCount}</CountBadge>}
            </IconLink>
          )}

          <AuthButton />

          <Link
            href="/cart"
            aria-label={`Bag (${cartCount})`}
            className={
              "inline-flex items-center gap-2.5 py-3 px-5 rounded-full no-underline " +
              "bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-sm font-semibold tracking-[0.08em] uppercase " +
              "border-none cursor-pointer " +
              "shadow-[0_6px_18px_rgba(255,79,163,0.35),0_0_0_1px_rgba(255,255,255,0.08)_inset] " +
              "transition-[transform,box-shadow] duration-200 [&_svg]:w-[18px] [&_svg]:h-[18px] " +
              "hover:-translate-y-px"
            }
          >
            <BagIcon />
            <span>Bag</span>
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full bg-white/20 text-[11px] font-bold leading-none">
              {cartCount}
            </span>
          </Link>
        </div>

        {/* Mobile actions: bag + burger */}
        <div className="hidden max-[1280px]:flex items-center gap-1.5">
          <IconLink href="/cart" label={`Bag (${cartCount})`} onClick={() => setMenuOpen(false)}>
            <BagIcon />
            {cartCount > 0 && <CountBadge>{cartCount}</CountBadge>}
          </IconLink>

          <IconButton
            label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </div>
      </div>

      {/* Click-away backdrop (mobile only) */}
      {menuOpen && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setMenuOpen(false)}
          className="min-[1281px]:hidden pointer-events-auto fixed inset-0 -z-10 cursor-default bg-black/30 backdrop-blur-[2px]"
        />
      )}

      {/* Mobile menu panel */}
      <div
        id="mobile-menu"
        className={
          "min-[1281px]:hidden pointer-events-auto w-full max-w-[calc(100vw-2rem)] mt-2 overflow-hidden " +
          "rounded-[28px] border border-white/[0.06] backdrop-blur-[20px] backdrop-saturate-150 " +
          "shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,79,163,0.08)_inset] " +
          "light:border-[rgba(26,13,18,0.08)] light:shadow-[0_24px_60px_rgba(180,120,140,0.2)] " +
          rowBgClass +
          (menuOpen ? " block" : " hidden")
        }
      >
        <nav aria-label="Mobile" className="flex flex-col p-3">
          {NAV_LINKS.map((link) =>
            link.children ? (
              <div key={link.label} className="flex flex-col">
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={mobileLinkClass}
                >
                  {link.label}
                </Link>
                <div className="flex flex-col ml-3 pl-3 border-l border-white/[0.08] light:border-[rgba(26,13,18,0.1)]">
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMenuOpen(false)}
                      className={
                        mobileLinkClass +
                        " text-xs tracking-[0.12em] text-ink-faint py-2.5"
                      }
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={mobileLinkClass}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)] p-3">
          <IconLink href="/account" label="Account" onClick={() => setMenuOpen(false)}>
            <UserIcon />
          </IconLink>

          {showWishlist && (
            <IconLink href="/wishlist" label={`Wishlist (${wishlistCount})`} onClick={() => setMenuOpen(false)}>
              <HeartIcon />
              {wishlistCount > 0 && <CountBadge>{wishlistCount}</CountBadge>}
            </IconLink>
          )}

          <IconButton label="Search" onClick={openSearch}>
            <SearchIcon />
          </IconButton>

          <IconButton
            label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </IconButton>

          <div className="ml-auto">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}

const iconBtnClasses =
  "relative w-11 h-11 inline-flex items-center justify-center rounded-full " +
  "bg-transparent text-ink-dim border border-transparent cursor-pointer " +
  "transition-[color,background-color,border-color] duration-200 " +
  "hover:text-ink hover:bg-white/5 hover:border-white/[0.06] " +
  "light:hover:bg-[rgba(26,13,18,0.05)] light:hover:border-[rgba(26,13,18,0.08)] " +
  "[&_svg]:w-5 [&_svg]:h-5";

function IconButton({
  label,
  onClick,
  children,
  ...rest
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={iconBtnClasses} {...rest}>
      {children}
    </button>
  );
}

function IconLink({
  href,
  label,
  onClick,
  children,
}: {
  href: string;
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} aria-label={label} onClick={onClick} className={iconBtnClasses}>
      {children}
    </Link>
  );
}

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-pink text-white text-[10px] font-semibold inline-flex items-center justify-center leading-none border-2 border-[rgba(15,12,13,0.72)]"
    >
      {children}
    </span>
  );
}

function NavDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = `${item.label.toLowerCase()}-menu`;

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // While open: close on Escape or a click outside the dropdown.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={`${desktopLinkClass} inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer ${open ? "text-ink" : ""}`}
      >
        {item.label}
        <ChevronDownIcon open={open} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={item.label}
          className={
            "absolute left-0 top-[calc(100%+10px)] min-w-[200px] flex flex-col p-2 " +
            "rounded-2xl border border-white/[0.08] backdrop-blur-[20px] backdrop-saturate-150 " +
            "bg-[rgba(15,12,13,0.97)] light:bg-[rgba(253,247,244,0.98)] light:border-[rgba(26,13,18,0.08)] " +
            "shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,79,163,0.08)_inset] light:shadow-[0_24px_60px_rgba(180,120,140,0.2)]"
          }
        >
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={
                "font-sans text-[13px] font-medium tracking-[0.08em] uppercase text-ink-dim no-underline rounded-xl py-2.5 px-3.5 " +
                "transition-colors duration-200 hover:text-ink hover:bg-white/5 focus-visible:text-ink focus-visible:bg-white/5 " +
                "light:hover:bg-[rgba(26,13,18,0.05)] light:focus-visible:bg-[rgba(26,13,18,0.05)]"
              }
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
