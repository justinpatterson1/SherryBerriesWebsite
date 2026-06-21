"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import type { CartSnapshotLine } from "@/app/api/cart/snapshot/route";
import { SHIPPING, type PaymentKey, type ShippingKey } from "@/lib/checkout/shipping";
import { StepIndicator } from "./shared";
import { CheckoutForm } from "./checkout-form";
import { CheckoutSummary, type AppliedPromo } from "./checkout-summary";
import { ThankYou, type PlacedOrder } from "./thank-you";

const PROMO_KEY = "sb-promo";

export type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  city: string;
  landmark: string;
};
export type FormErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CheckoutClient({
  initial,
}: {
  initial: { firstName: string; lastName: string; email: string; phone: string; line1: string; city: string };
}) {
  const { items: cartLines, ready, clearCart } = useCart();

  const [snapshot, setSnapshot] = useState<CartSnapshotLine[]>([]);
  const [snapshotReady, setSnapshotReady] = useState(false);

  const [form, setForm] = useState<FormState>({
    firstName: initial.firstName,
    lastName: initial.lastName,
    email: initial.email,
    phone: initial.phone,
    line1: initial.line1,
    city: initial.city,
    landmark: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [shipping, setShipping] = useState<ShippingKey>("pickup");
  const [payment, setPayment] = useState<PaymentKey>("cod");

  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Enrich the cart for display (auth users → snapshot route reads the DB cart).
  useEffect(() => {
    if (!ready) return;
    if (cartLines.length === 0) {
      queueMicrotask(() => {
        setSnapshot([]);
        setSnapshotReady(true);
      });
      return;
    }
    let cancelled = false;
    fetch("/api/cart/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cartLines }),
    })
      .then((r) => r.json())
      .then((data: { items: CartSnapshotLine[] }) => {
        if (cancelled) return;
        setSnapshot(data.items ?? []);
        setSnapshotReady(true);
      })
      .catch(() => {
        if (!cancelled) setSnapshotReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, cartLines]);

  // Re-hydrate any promo carried over from the cart (re-validated so an
  // expired/disabled code silently drops instead of mis-pricing).
  useEffect(() => {
    let code: string | null = null;
    try {
      const raw = sessionStorage.getItem(PROMO_KEY);
      if (raw) code = (JSON.parse(raw) as { code?: string }).code ?? null;
    } catch {
      code = null;
    }
    if (!code) return;
    let cancelled = false;
    fetch("/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AppliedPromo | null) => {
        if (!cancelled && data?.code) setPromo(data);
        else sessionStorage.removeItem(PROMO_KEY);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (order) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [order]);

  // Surface a message when WiPay redirects back here (a card payment that
  // didn't complete cleanly), then strip the query param so it shows once.
  useEffect(() => {
    const wipay = new URLSearchParams(window.location.search).get("wipay");
    if (!wipay) return;
    queueMicrotask(() => {
      if (wipay === "error") {
        showToast("We couldn't confirm your payment. If you were charged, please contact support.");
      } else if (wipay === "pending") {
        showToast("Your payment is still processing — we'll email you once it's confirmed.");
      }
    });
    window.history.replaceState(null, "", window.location.pathname);
  }, [showToast]);

  const totals = useMemo(() => {
    const subtotal = snapshot.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    let discount = 0;
    if (promo) {
      if (promo.percentageOff != null) discount = (subtotal * promo.percentageOff) / 100;
      else if (promo.amountOff != null) discount = Math.min(subtotal, promo.amountOff);
    }
    const shipFee = SHIPPING[shipping].fee;
    const total = Math.max(0, subtotal - discount + shipFee);
    return { subtotal, discount, shipFee, total };
  }, [snapshot, promo, shipping]);

  const setField = useCallback((key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }, []);

  const applyPromo = useCallback(
    (p: AppliedPromo) => {
      setPromo(p);
      try {
        sessionStorage.setItem(PROMO_KEY, JSON.stringify({ code: p.code }));
      } catch {}
      showToast(`✦ ${p.code} applied — ${p.label}`);
    },
    [showToast],
  );

  const removePromo = useCallback(() => {
    setPromo(null);
    try {
      sessionStorage.removeItem(PROMO_KEY);
    } catch {}
    showToast("Promo removed");
  }, [showToast]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.firstName.trim()) next.firstName = "Required";
    if (!form.lastName.trim()) next.lastName = "Required";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a valid phone";
    if (!form.line1.trim()) next.line1 = "Required";
    if (!form.city.trim()) next.city = "Required";
    setErrors(next);
    const firstBad = Object.keys(next)[0];
    if (firstBad) {
      document.getElementById(`co-${firstBad}`)?.focus();
      showToast("Please complete the highlighted fields");
      return false;
    }
    return true;
  }

  const placeOrder = useCallback(async () => {
    if (!validate()) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
          },
          address: { line1: form.line1.trim(), city: form.city.trim(), landmark: form.landmark.trim() },
          shipping,
          payment,
          promoCode: promo?.code ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        order?: PlacedOrder;
        redirect?: string;
        error?: string;
      };
      if (!res.ok || (!data.order && !data.redirect)) {
        showToast(data.error ?? "Something went wrong placing your order");
        setPlacing(false);
        return;
      }
      try {
        sessionStorage.removeItem(PROMO_KEY);
      } catch {}
      // Card → hand off to WiPay's hosted page. Keep `placing` true so the
      // button stays disabled while the browser navigates away.
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      clearCart();
      setOrder(data.order!);
    } catch {
      showToast("Network error — please try again");
      setPlacing(false);
    }
    // Intentionally leave `placing` true on success — the view swaps to Thank-You.
  }, [form, shipping, payment, promo, clearCart, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = snapshotReady && snapshot.length === 0;

  return (
    <main className="pt-[110px] pb-[100px] max-[900px]:pt-[100px] max-[900px]:pb-20 px-[8%] max-[900px]:px-[6%]">
      {order ? (
        <ThankYou order={order} />
      ) : (
        <>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 font-sans text-[11px] font-medium tracking-[0.18em] uppercase text-ink-faint no-underline transition-[color,gap] duration-200 hover:text-blush hover:gap-3"
          >
            <span aria-hidden="true">←</span> Back to bag
          </Link>

          <div className="mt-6 mb-9">
            <StepIndicator current="checkout" />
            <h1 className="font-display text-[clamp(38px,5vw,60px)] leading-[1.04] tracking-[-0.01em] text-ink m-0">
              Secure{" "}
              <em className="font-serif italic text-blush font-medium">checkout</em>.
            </h1>
          </div>

          {!snapshotReady ? (
            <div className="p-10 rounded-[18px] border border-white/[0.06] bg-card animate-pulse light:border-[rgba(26,13,18,0.08)]">
              <p className="font-serif italic text-[18px] text-ink-faint m-0">
                Preparing your checkout…
              </p>
            </div>
          ) : isEmpty ? (
            <CheckoutEmpty />
          ) : (
            <div className="grid grid-cols-[1fr_400px] gap-[60px] items-start max-[1100px]:gap-10 max-[940px]:grid-cols-1">
              <CheckoutForm
                form={form}
                errors={errors}
                onField={setField}
                shipping={shipping}
                onSelectShipping={setShipping}
                payment={payment}
                onSelectPayment={setPayment}
              />
              <CheckoutSummary
                items={snapshot}
                totals={totals}
                shippingLabel={SHIPPING[shipping].label}
                promo={promo}
                placing={placing}
                onApplyPromo={applyPromo}
                onRemovePromo={removePromo}
                onError={showToast}
                onPlaceOrder={placeOrder}
              />
            </div>
          )}
        </>
      )}

      <div
        role="status"
        aria-live="polite"
        className={
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] py-3.5 px-[22px] rounded-full " +
          "bg-[rgba(15,12,13,0.92)] border border-pink/[0.28] text-white font-sans text-[13px] font-medium tracking-[0.04em] " +
          "backdrop-blur-[20px] shadow-[0_18px_40px_rgba(0,0,0,0.5)] " +
          "transition-[opacity,transform] duration-[240ms] pointer-events-none " +
          (toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5")
        }
      >
        {toast?.msg}
      </div>
    </main>
  );
}

function CheckoutEmpty() {
  return (
    <div className="text-center py-16 rounded-[18px] border border-white/[0.06] bg-card light:border-[rgba(26,13,18,0.08)]">
      <div className="mx-auto mb-4 inline-flex w-14 h-14 items-center justify-center rounded-full bg-pink/[0.1] text-pink text-[26px]">
        ◇
      </div>
      <h2 className="font-display text-[26px] text-ink m-0 mb-2">
        Nothing to check out yet
      </h2>
      <p className="font-sans text-[14px] text-ink-dim m-0 mb-6 max-w-[360px] mx-auto">
        Your bag is empty — add a piece or two and they&apos;ll show up here.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/products"
          className="py-3 px-6 rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[12px] font-bold tracking-[0.12em] uppercase no-underline shadow-[0_8px_20px_rgba(255,79,163,0.34)]"
        >
          Shop pieces
        </Link>
        <Link
          href="/cart"
          className="py-3 px-6 rounded-full border border-white/14 text-ink-dim font-sans text-[12px] font-bold tracking-[0.12em] uppercase no-underline hover:text-ink hover:border-blush transition-colors light:border-[rgba(26,13,18,0.14)]"
        >
          View bag
        </Link>
      </div>
    </div>
  );
}
