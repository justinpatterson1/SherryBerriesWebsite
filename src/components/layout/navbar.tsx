"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { AuthButton } from "@/components/auth/auth-button";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Bestsellers", href: "/bestsellers" },
  { label: "Our Story", href: "/our-story" },
  { label: "Learn", href: "/learn" },
  { label: "Community", href: "/community" },
];

type Theme = "dark" | "light";

const navRowBase =
  "pointer-events-auto w-full max-w-[60vw] flex items-center gap-7 " +
  "py-[calc(10px+0.5rem)] pl-7 pr-[18px] rounded-full " +
  "border border-white/[0.06] backdrop-blur-[20px] backdrop-saturate-150 " +
  "shadow-[0_12px_40px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.04)_inset,0_0_0_1px_rgba(255,79,163,0.08)_inset,0_0_60px_rgba(255,79,163,0.08)_inset] " +
  "transition-[background-color,box-shadow] duration-[240ms] " +
  "light:border-[rgba(26,13,18,0.08)] " +
  "light:shadow-[0_12px_40px_rgba(180,120,140,0.18),0_1px_0_rgba(255,255,255,0.6)_inset,0_0_0_1px_rgba(255,79,163,0.1)_inset]";

export function Navbar() {
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const rowBgClass = scrolled
    ? "bg-[rgba(11,9,10,0.9)] light:bg-[rgba(253,247,244,0.94)]"
    : "bg-[rgba(15,12,13,0.72)] light:bg-[rgba(253,247,244,0.78)]";

  return (
    <header className="fixed top-[18px] inset-x-0 z-50 flex justify-center pointer-events-none px-4">
      <div className={`${navRowBase} ${rowBgClass}`}>
        <Link
          href="/"
          aria-label="SherryBerries home"
          className="font-display text-[28px] tracking-[0.02em] text-ink no-underline leading-none whitespace-nowrap"
        >
          Sherry
          <span className="font-serif italic text-pink ml-px">Berries</span>
        </Link>

        <nav
          aria-label="Primary"
          className="flex items-center gap-7 ml-2 flex-1 justify-center max-[980px]:hidden"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                "relative font-sans text-sm font-medium tracking-[0.12em] uppercase text-ink-dim no-underline py-2 " +
                "transition-colors duration-200 hover:text-ink focus-visible:text-ink " +
                "after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-pink " +
                "after:scale-x-0 after:origin-left after:transition-transform after:duration-[260ms] after:ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
                "hover:after:scale-x-100 focus-visible:after:scale-x-100"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <IconButton
            label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </IconButton>

          <IconButton label="Search">
            <SearchIcon />
          </IconButton>

          <IconLink href="/account" label="Account">
            <UserIcon />
          </IconLink>

          <IconLink href="/wishlist" label={`Wishlist (${wishlistCount})`}>
            <HeartIcon />
            {wishlistCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-pink text-white text-[10px] font-semibold inline-flex items-center justify-center leading-none border-2 border-[rgba(15,12,13,0.72)]"
              >
                {wishlistCount}
              </span>
            )}
          </IconLink>

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
              "hover:-translate-y-px " +
              "max-[980px]:px-3"
            }
          >
            <BagIcon />
            <span className="max-[980px]:hidden">Bag</span>
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full bg-white/20 text-[11px] font-bold leading-none max-[980px]:hidden">
              {cartCount}
            </span>
          </Link>
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
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={iconBtnClasses}>
      {children}
    </button>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} aria-label={label} className={iconBtnClasses}>
      {children}
    </Link>
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
