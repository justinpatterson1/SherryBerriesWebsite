"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { money } from "./shared";

export type PlacedOrder = {
  orderNumber: string;
  dateLabel: string;
  items: { name: string; variant: string | null; qty: number; price: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  shipFee: number;
  shipLabel: string;
  paymentLabel: string;
  total: number;
  eta: string;
  contact: { firstName: string; lastName: string; email: string; phone: string };
  shipTo: string;
};

export function ThankYou({ order }: { order: PlacedOrder }) {
  const itemCount = order.items.reduce((n, it) => n + it.qty, 0);
  const isCod = order.paymentLabel === "Cash on Delivery";

  return (
    <div className="relative max-w-[600px] mx-auto text-center py-10">
      {/* Soft pink glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,79,163,0.22),transparent_68%)]"
      />

      <div className="relative">
        {/* Checkmark */}
        <span
          className="inline-grid place-items-center w-[90px] h-[90px] rounded-full bg-gradient-to-br from-pink to-pink-deep shadow-[0_16px_40px_rgba(255,79,163,0.4)] animate-[tyPop_0.5s_cubic-bezier(0.22,1,0.36,1)]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>

        <p className="font-sans text-[11px] font-bold tracking-[0.24em] uppercase text-pink m-0 mt-6">
          Order confirmed
        </p>
        <h1 className="font-display text-[clamp(38px,5.5vw,56px)] leading-[1.06] text-ink m-0 mt-2">
          Thank you,{" "}
          <em className="font-serif italic text-blush font-medium">
            {order.contact.firstName}
          </em>
          !
        </h1>
        <p className="font-sans text-[15px] leading-[1.65] text-ink-dim m-0 mt-3 max-w-[440px] mx-auto">
          Your order is in — we&apos;re already wrapping it in pink and gold. A
          confirmation has been sent to{" "}
          <span className="text-ink">{order.contact.email}</span>.
        </p>

        {/* Order card */}
        <div className="mt-8 text-left rounded-[18px] border border-line-pink bg-card p-6 light:border-[rgba(26,13,18,0.1)]">
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.06] light:border-[rgba(26,13,18,0.08)]">
            <div>
              <p className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-ink-faint m-0">
                Order number
              </p>
              <p className="font-serif text-[20px] font-semibold text-ink m-0 mt-0.5">
                {order.orderNumber}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full border border-[rgba(232,200,121,0.3)] bg-[rgba(232,200,121,0.12)] text-gold-soft font-sans text-[10px] font-bold tracking-[0.12em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-soft" aria-hidden="true" />
              Processing
            </span>
          </div>

          <OrderRow label="Date" value={order.dateLabel} />
          <OrderRow label="Items" value={`${itemCount} item${itemCount === 1 ? "" : "s"}`} />
          <OrderRow label="Ship to" value={order.shipTo} />
          <OrderRow label="Method" value={order.shipLabel} />
          <OrderRow label="Payment" value={order.paymentLabel} />
          {order.discount > 0 && (
            <OrderRow label="Discount" value={`−${money(order.discount)}`} blush />
          )}
          <div className="flex items-center justify-between pt-3 mt-1">
            <span className="font-sans text-[13px] font-semibold tracking-[0.04em] uppercase text-ink-dim">
              Total
            </span>
            <span className="font-serif text-[22px] font-semibold text-ink">
              {money(order.total)}
            </span>
          </div>
        </div>

        {/* Next steps */}
        <div className="mt-4 flex items-start gap-3 text-left p-4 rounded-[14px] border border-pink/20 bg-pink/[0.07]">
          <span className="flex-none text-blush mt-0.5" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M3 6h11v9H3z" />
              <path d="M14 9h4l3 3v3h-7z" />
              <circle cx="7" cy="18" r="1.6" />
              <circle cx="17" cy="18" r="1.6" />
            </svg>
          </span>
          <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0">
            {order.eta}. We&apos;ll text{" "}
            <span className="text-ink">{order.contact.phone}</span> with updates
            {isCod ? " — please have payment ready on arrival." : "."}
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-7 flex items-center justify-center gap-3 max-[480px]:flex-col">
          <Link
            href="/account?view=orders"
            className="py-3.5 px-7 rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[12px] font-bold tracking-[0.12em] uppercase no-underline shadow-[0_10px_26px_rgba(255,79,163,0.34)] transition-transform duration-200 hover:-translate-y-px max-[480px]:w-full max-[480px]:text-center"
          >
            Track my order →
          </Link>
          <Link
            href="/products"
            className="py-3.5 px-7 rounded-full border border-white/14 text-ink-dim font-sans text-[12px] font-bold tracking-[0.12em] uppercase no-underline transition-colors hover:text-ink hover:border-blush light:border-[rgba(26,13,18,0.14)] max-[480px]:w-full max-[480px]:text-center"
          >
            Continue shopping
          </Link>
        </div>
      </div>

      <style>{`@keyframes tyPop{0%{opacity:0;transform:scale(0.4)}60%{transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

function OrderRow({
  label,
  value,
  blush,
}: {
  label: string;
  value: ReactNode;
  blush?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-dashed border-white/[0.1] light:border-[rgba(26,13,18,0.12)]">
      <span className="font-sans text-[12px] tracking-[0.06em] uppercase text-ink-faint flex-none">
        {label}
      </span>
      <span className={"font-sans text-[13px] text-right " + (blush ? "text-blush font-semibold" : "text-ink")}>
        {value}
      </span>
    </div>
  );
}
