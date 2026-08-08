"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import {
  lineKey,
  readSaved,
  writeSaved,
  type SavedItem,
} from "@/lib/cart/local-extras";
import type { CartSnapshotLine } from "@/app/api/cart/snapshot/route";
import { CartRow } from "./cart-row";
import { OrderSummary, type AppliedPromo } from "./order-summary";
import { SavedForLater } from "./saved-for-later";
import { CartEmpty } from "./cart-empty";
import { TrustStrip } from "./trust-strip";

// The bag is a subtotal-only summary: shipping depends on the delivery method
// picked at checkout, so it is quoted there rather than estimated here. There is
// no free-shipping threshold and no tax — see the commented-out tax block below.

export function CartClient() {
  const router = useRouter();
  const { items: cartLines, ready, updateQuantity, removeLine, addItem } = useCart();

  const [snapshot, setSnapshot] = useState<CartSnapshotLine[]>([]);
  const [snapshotReady, setSnapshotReady] = useState(false);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [removingKeys, setRemovingKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    queueMicrotask(() => {
      setSaved(readSaved());
    });
  }, []);

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
        if (cancelled) return;
        setSnapshotReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, cartLines]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((msg: string) => {
    setToast({ msg, id: Date.now() });
  }, []);

  // A WiPay card payment that failed/was abandoned redirects back here with the
  // bag rebuilt. Let the shopper know, then strip the param so it shows once.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("wipay") !== "failed") return;
    queueMicrotask(() => {
      showToast("Payment didn't go through — your bag is saved. Feel free to try again.");
    });
    window.history.replaceState(null, "", window.location.pathname);
  }, [showToast]);

  const totals = useMemo(() => {
    const visible = snapshot.filter(
      (line) => !removingKeys.has(lineKey(line.productId, line.variantId)),
    );
    const subtotal = visible.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

    let discount = 0;
    if (promo) {
      if (promo.percentageOff != null) {
        discount = (subtotal * promo.percentageOff) / 100;
      } else if (promo.amountOff != null) {
        discount = Math.min(subtotal, promo.amountOff);
      }
    }

    const total = Math.max(0, subtotal - discount);

    // No tax is charged. Kept here, commented, in case that changes:
    // const tax = total * TAX_RATE;
    // const total = Math.max(0, subtotal - discount) + tax;

    const itemCount = visible.reduce((n, l) => n + l.quantity, 0);

    return { subtotal, discount, total, itemCount };
  }, [snapshot, removingKeys, promo]);

  const removeWithAnimation = useCallback(
    async (productId: string, variantId: string | null, message: string) => {
      const key = lineKey(productId, variantId);
      setRemovingKeys((prev) => new Set(prev).add(key));
      await new Promise((r) => setTimeout(r, 280));
      const result = await removeLine({ productId, variantId });
      if (!result.ok) {
        setRemovingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        showToast(result.error ?? "Couldn't remove that item");
        return false;
      }
      // Optimistically drop from the local snapshot so the row doesn't briefly
      // reappear (unfaded) between `removingKeys` being cleared and the snapshot
      // refetch arriving.
      setSnapshot((prev) =>
        prev.filter(
          (l) => !(l.productId === productId && l.variantId === variantId),
        ),
      );
      setRemovingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      showToast(message);
      return true;
    },
    [removeLine, showToast],
  );

  const onRemove = (productId: string, variantId: string | null) =>
    removeWithAnimation(productId, variantId, "Removed from bag");

  const onSaveForLater = async (
    productId: string,
    variantId: string | null,
  ) => {
    const removed = await removeWithAnimation(
      productId,
      variantId,
      "Saved for later ♡",
    );
    if (!removed) return;
    setSaved((prev) => {
      if (prev.some((s) => s.productId === productId && s.variantId === variantId)) {
        return prev;
      }
      const next = [...prev, { productId, variantId }];
      writeSaved(next);
      return next;
    });
  };

  const onMoveBackToBag = async (item: SavedItem) => {
    const result = await addItem({
      productId: item.productId,
      variantId: item.variantId,
      quantity: 1,
    });
    if (!result.ok) {
      showToast(result.error ?? "Couldn't move to bag");
      return;
    }
    setSaved((prev) => {
      const next = prev.filter(
        (s) => !(s.productId === item.productId && s.variantId === item.variantId),
      );
      writeSaved(next);
      return next;
    });
    showToast("Moved to bag ✦");
  };

  const onQtyChange = async (
    productId: string,
    variantId: string | null,
    qty: number,
  ) => {
    const result = await updateQuantity({ productId, variantId }, qty);
    if (!result.ok) showToast(result.error ?? "Couldn't update quantity");
  };

  const isEmpty = snapshotReady && snapshot.length === 0;

  return (
    <main className="pt-[110px] pb-[100px] max-[900px]:pt-[100px] max-[900px]:pb-20">
      <div className="px-[8%] max-[900px]:px-[6%]">
        <Link
          href="/products"
          className={
            "inline-flex items-center gap-2 font-sans text-[11px] font-medium tracking-[0.18em] uppercase " +
            "text-ink-faint no-underline transition-[color,gap] duration-200 " +
            "hover:text-blush hover:gap-3"
          }
        >
          <span aria-hidden="true">←</span> Continue shopping
        </Link>

        <header className="mt-6 mb-10 pb-6 border-b border-white/[0.06] light:border-[rgba(26,13,18,0.08)]">
          <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[1.04] tracking-[-0.01em] text-ink m-0">
            Your{" "}
            <em className="font-serif italic text-blush font-medium not-italic-fallback">
              bag
            </em>
            .
          </h1>
        </header>
      </div>

      {!snapshotReady ? (
        <div className="px-[8%] max-[900px]:px-[6%]">
          <div className="p-10 rounded-[20px] border border-white/[0.06] bg-card animate-pulse">
            <p className="font-serif italic text-[18px] text-ink-faint m-0">
              Loading your bag…
            </p>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="px-[8%] max-[900px]:px-[6%]">
          <CartEmpty />
        </div>
      ) : (
        <div className="px-[8%] grid grid-cols-[1fr_400px] gap-[60px] max-[1100px]:gap-10 max-[980px]:grid-cols-1 max-[900px]:px-[6%]">
          <div className="flex flex-col gap-4">
            {snapshot.map((line) => {
              const key = lineKey(line.productId, line.variantId);
              return (
                <CartRow
                  key={key}
                  line={line}
                  removing={removingKeys.has(key)}
                  onQtyChange={onQtyChange}
                  onRemove={onRemove}
                  onSaveForLater={onSaveForLater}
                />
              );
            })}
          </div>

          <OrderSummary
            totals={totals}
            promo={promo}
            onApplyPromo={(p) => {
              setPromo(p);
              showToast(`✦ ${p.code} applied — ${p.label}`);
            }}
            onRemovePromo={() => {
              setPromo(null);
              showToast("Promo removed");
            }}
            onCheckout={() => {
              // Carry any applied promo into checkout, then hand off.
              try {
                if (promo) {
                  sessionStorage.setItem("sb-promo", JSON.stringify({ code: promo.code }));
                } else {
                  sessionStorage.removeItem("sb-promo");
                }
              } catch {}
              router.push("/checkout");
            }}
            onError={showToast}
          />
        </div>
      )}

      {saved.length > 0 && snapshot.length > 0 && (
        <div className="px-[8%] mt-16 max-[900px]:px-[6%] max-[900px]:mt-12">
          <SavedForLater items={saved} onMoveBack={onMoveBackToBag} />
        </div>
      )}

      <div className="px-[8%] mt-16 max-[900px]:px-[6%] max-[900px]:mt-12">
        <TrustStrip />
      </div>

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
