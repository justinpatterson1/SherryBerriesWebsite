"use client";

import type { ReactNode } from "react";
import {
  PAYMENT_LABEL,
  SHIPPING,
  SHIPPING_ORDER,
  type PaymentKey,
  type ShippingKey,
} from "@/lib/checkout/shipping";
import type { FormErrors, FormState } from "./checkout-client";
import { Field, SectionCard, fieldClass, money } from "./shared";

export function CheckoutForm({
  form,
  errors,
  onField,
  shipping,
  onSelectShipping,
  payment,
  onSelectPayment,
}: {
  form: FormState;
  errors: FormErrors;
  onField: (key: keyof FormState, value: string) => void;
  shipping: ShippingKey;
  onSelectShipping: (key: ShippingKey) => void;
  payment: PaymentKey;
  onSelectPayment: (key: PaymentKey) => void;
}) {
  const input = (key: keyof FormState, props?: Record<string, string>) => {
    const invalid = !!errors[key];
    return (
      <input
        id={`co-${key}`}
        value={form[key]}
        onChange={(e) => onField(key, e.target.value)}
        className={
          fieldClass +
          (invalid
            ? " border-[#ff8d8d] bg-[rgba(255,141,141,0.06)] focus:border-[#ff8d8d]"
            : "")
        }
        {...props}
      />
    );
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      {/* 1 — Contact */}
      <SectionCard step={1} title="Contact information">
        <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          <Field label="First name" htmlFor="co-firstName" required error={errors.firstName}>
            {input("firstName", { autoComplete: "given-name" })}
          </Field>
          <Field label="Last name" htmlFor="co-lastName" required error={errors.lastName}>
            {input("lastName", { autoComplete: "family-name" })}
          </Field>
          <Field label="Email" htmlFor="co-email" required error={errors.email} span2>
            {input("email", { type: "email", autoComplete: "email" })}
          </Field>
          <Field label="Phone number" htmlFor="co-phone" required error={errors.phone} span2>
            {input("phone", { type: "tel", autoComplete: "tel" })}
          </Field>
        </div>
      </SectionCard>

      {/* 2 — Shipping address */}
      <SectionCard step={2} title="Shipping address">
        <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          <Field label="Address" htmlFor="co-line1" required error={errors.line1} span2>
            {input("line1", { autoComplete: "address-line1" })}
          </Field>
          <Field label="City / Town" htmlFor="co-city" required error={errors.city}>
            {input("city", { autoComplete: "address-level2" })}
          </Field>
          <Field label="Landmark" htmlFor="co-landmark" optional>
            {input("landmark", { placeholder: "Near…" })}
          </Field>
        </div>
      </SectionCard>

      {/* 3 — Shipping method */}
      <SectionCard step={3} title="Shipping method">
        <div className="flex flex-col gap-3">
          {SHIPPING_ORDER.map((key) => {
            const opt = SHIPPING[key];
            return (
              <OptionCard
                key={key}
                selected={shipping === key}
                onSelect={() => onSelectShipping(key)}
                icon={SHIP_ICON[key]}
                title={opt.label}
                sub={opt.sub}
                right={
                  opt.fee === 0 ? (
                    <span className="font-sans text-[14px] font-bold text-[#5fd29a]">Free</span>
                  ) : (
                    <span className="font-serif text-[16px] font-semibold text-ink">
                      {money(opt.fee)}
                    </span>
                  )
                }
              />
            );
          })}
        </div>
      </SectionCard>

      {/* 4 — Payment */}
      <SectionCard step={4} title="Payment method">
        <div className="flex flex-col gap-3">
          <OptionCard
            selected={payment === "cod"}
            onSelect={() => onSelectPayment("cod")}
            icon={PAY_ICON.cod}
            title={PAYMENT_LABEL.cod}
            sub="Pay when your order arrives"
          />
          <OptionCard
            selected={payment === "card"}
            onSelect={() => onSelectPayment("card")}
            icon={PAY_ICON.card}
            title="Credit Card"
            sub="Secure payment via WiPay"
            right={
              <span className="font-sans text-[10px] font-bold tracking-[0.1em] uppercase text-blush bg-pink/[0.12] border border-pink/30 rounded-full py-1 px-2.5">
                WiPay
              </span>
            }
          />

          {/* Card details are entered on WiPay's secure hosted page — never on
              our site (PCI). Reveal a redirect notice instead of card inputs. */}
          <div
            className={
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out " +
              (payment === "card" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")
            }
          >
            <div className="overflow-hidden">
              <div className="pt-1 flex items-start gap-3 p-4 rounded-[12px] border border-pink/20 bg-pink/[0.06]">
                <span className="flex-none text-blush mt-0.5" aria-hidden="true">
                  <LockIcon />
                </span>
                <p className="font-sans text-[12.5px] leading-[1.6] text-ink-dim m-0">
                  When you place your order you&apos;ll be taken to{" "}
                  <span className="text-ink font-semibold">WiPay&apos;s secure page</span>{" "}
                  to enter your card. We never see or store your card details. You&apos;ll
                  return here once payment is confirmed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </form>
  );
}

function OptionCard({
  selected,
  onSelect,
  icon,
  title,
  sub,
  right,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  sub: string;
  right?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={
        "flex items-center gap-3.5 text-left p-4 rounded-[14px] border cursor-pointer transition-[border-color,background-color] duration-200 " +
        (selected
          ? "border-pink bg-[linear-gradient(120deg,rgba(255,79,163,0.12),rgba(255,79,163,0.03))] shadow-[0_0_0_3px_rgba(255,79,163,0.12)_inset]"
          : "border-white/12 bg-white/[0.02] hover:border-blush light:border-[rgba(26,13,18,0.12)]")
      }
    >
      <span
        className={
          "flex-none w-5 h-5 rounded-full border-2 grid place-items-center transition-colors " +
          (selected ? "border-pink" : "border-line-strong")
        }
        aria-hidden="true"
      >
        <span className={"w-2.5 h-2.5 rounded-full bg-pink transition-transform " + (selected ? "scale-100" : "scale-0")} />
      </span>
      <span className="flex-none text-blush [&_svg]:w-[22px] [&_svg]:h-[22px]" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-sans text-[14px] font-semibold text-ink">{title}</span>
        <span className="block font-sans text-[12px] text-ink-faint mt-0.5">{sub}</span>
      </span>
      {right && <span className="flex-none">{right}</span>}
    </button>
  );
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const SHIP_ICON: Record<ShippingKey, ReactNode> = {
  pickup: (
    <Svg>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
      <path d="M9 13h6" />
    </Svg>
  ),
  ttpost: (
    <Svg>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </Svg>
  ),
  courier: (
    <Svg>
      <path d="M3 6h11v9H3z" />
      <path d="M14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </Svg>
  ),
};

const PAY_ICON: Record<PaymentKey, ReactNode> = {
  cod: (
    <Svg>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9.5v.01M18 14.5v.01" />
    </Svg>
  ),
  card: (
    <Svg>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 9.5h19" />
      <path d="M6 14.5h4" />
    </Svg>
  ),
};
