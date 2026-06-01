"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/components/providers/wishlist-provider";
import type { WishSnapshotItem } from "@/app/api/wishlist/snapshot/route";
import { WishCard } from "./wish-card";
import { WishEmpty } from "./wish-empty";
import { WishRecs } from "./wish-recs";

export type RecProduct = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  categoryName: string;
  rating: number;
  reviewCount: number;
};

export function WishlistClient({ recPool }: { recPool: RecProduct[] }) {
  const router = useRouter();
  const { ids, ready, toggle } = useWishlist();
  const { items: cartLines, addItem } = useCart();

  const [snapshot, setSnapshot] = useState<WishSnapshotItem[]>([]);
  const [snapshotReady, setSnapshotReady] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);

  // Enrich the wishlist IDs into displayable products (mirrors the cart snapshot).
  useEffect(() => {
    if (!ready) return;
    const idList = Array.from(ids);
    if (idList.length === 0) {
      queueMicrotask(() => {
        setSnapshot([]);
        setSnapshotReady(true);
      });
      return;
    }
    let cancelled = false;
    fetch("/api/wishlist/snapshot", { method: "POST" })
      .then((r) => r.json())
      .then((data: { items: WishSnapshotItem[] }) => {
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
  }, [ready, ids]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((msg: string) => {
    setToast({ msg, id: Date.now() });
  }, []);

  const cartIds = useMemo(
    () => new Set(cartLines.map((l) => l.productId)),
    [cartLines],
  );

  const categories = useMemo(
    () => Array.from(new Set(snapshot.map((s) => s.categoryName))),
    [snapshot],
  );

  const visible = useMemo(
    () =>
      activeFilter === "all"
        ? snapshot
        : snapshot.filter((s) => s.categoryName === activeFilter),
    [snapshot, activeFilter],
  );

  const total = useMemo(
    () => snapshot.reduce((sum, s) => sum + s.price, 0),
    [snapshot],
  );

  const recs = useMemo(
    () => recPool.filter((p) => !ids.has(p.id)).slice(0, 4),
    [recPool, ids],
  );

  const onRemove = useCallback(
    (productId: string) => {
      setRemovingIds((prev) => new Set(prev).add(productId));
      setTimeout(async () => {
        const result = await toggle(productId);
        if (!result.ok) {
          setRemovingIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
          showToast(result.error ?? "Couldn't remove that piece");
          return;
        }
        setSnapshot((prev) => prev.filter((s) => s.productId !== productId));
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        showToast("Removed from wishlist");
      }, 300);
    },
    [toggle, showToast],
  );

  const onAdd = useCallback(
    async (productId: string) => {
      if (cartIds.has(productId)) {
        router.push("/cart");
        return;
      }
      const item = snapshot.find((s) => s.productId === productId);
      const result = await addItem({ productId, variantId: null, quantity: 1 });
      if (!result.ok) {
        showToast(result.error ?? "Couldn't add to bag");
        return;
      }
      showToast(`${item?.name ?? "Piece"} added to bag ✦`);
    },
    [cartIds, snapshot, addItem, router, showToast],
  );

  const onRecAdd = useCallback(
    async (productId: string) => {
      const result = await toggle(productId);
      if (!result.ok) {
        showToast(result.error ?? "Couldn't save that piece");
        return;
      }
      showToast("Saved to wishlist ♡");
    },
    [toggle, showToast],
  );

  const onAddAll = useCallback(async () => {
    const toAdd = visible.filter((s) => !cartIds.has(s.productId));
    if (toAdd.length === 0) {
      showToast("Everything's already in your bag");
      return;
    }
    await Promise.all(
      toAdd.map((s) =>
        addItem({ productId: s.productId, variantId: null, quantity: 1 }),
      ),
    );
    showToast(`${toAdd.length} piece${toAdd.length === 1 ? "" : "s"} added to bag ✦`);
  }, [visible, cartIds, addItem, showToast]);

  const onShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Wishlist link copied ✦");
    } catch {
      showToast("Copy your browser's address to share ✦");
    }
  }, [showToast]);

  const isEmpty = snapshotReady && snapshot.length === 0;
  const hasItems = snapshotReady && snapshot.length > 0;

  return (
    <main className="pt-[110px] pb-[100px] max-[900px]:pt-[100px] max-[900px]:pb-20">
      <div className="px-[8%] max-[900px]:px-[6%]">
        <Link
          href="/#shop"
          className={
            "inline-flex items-center gap-2 font-sans text-[11px] font-medium tracking-[0.18em] uppercase " +
            "text-ink-faint no-underline transition-[color,gap] duration-200 " +
            "hover:text-blush hover:gap-3"
          }
        >
          <span aria-hidden="true">←</span> Continue shopping
        </Link>

        <header className="mt-6 mb-10 pb-6 border-b border-white/[0.06] light:border-[rgba(26,13,18,0.08)] grid grid-cols-[1fr_auto] items-end gap-6 max-[640px]:grid-cols-1 max-[640px]:gap-4">
          <div>
            <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[1.04] tracking-[-0.01em] text-ink m-0">
              Your{" "}
              <em className="font-serif italic text-blush font-medium">wishlist</em>.
            </h1>
            <p className="font-sans text-[14px] leading-[1.6] text-ink-dim m-0 mt-3 max-w-[560px]">
              The pieces you&apos;re dreaming of. Saved across every device when
              you&apos;re signed in — move them to your bag whenever you&apos;re ready.
            </p>
          </div>

          {hasItems && (
            <div className="flex items-center gap-2.5 max-[640px]:flex-wrap">
              <button
                type="button"
                onClick={onShare}
                className={
                  "inline-flex items-center gap-2 py-3 px-5 rounded-full border border-white/14 bg-transparent " +
                  "text-ink-dim font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer " +
                  "transition-[color,border-color,background-color] duration-200 " +
                  "hover:text-ink hover:border-blush hover:bg-pink/[0.06] [&_svg]:w-[15px] [&_svg]:h-[15px] " +
                  "light:border-[rgba(26,13,18,0.14)]"
                }
              >
                <ShareIcon /> Share
              </button>
              <button
                type="button"
                onClick={onAddAll}
                className={
                  "inline-flex items-center gap-2 py-3 px-5 rounded-full border-0 cursor-pointer " +
                  "bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[12px] font-bold tracking-[0.12em] uppercase " +
                  "shadow-[0_10px_24px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
                  "transition-transform duration-200 hover:-translate-y-px"
                }
              >
                Add all to bag →
              </button>
            </div>
          )}
        </header>
      </div>

      {!snapshotReady ? (
        <div className="px-[8%] max-[900px]:px-[6%]">
          <div className="p-10 rounded-[20px] border border-white/[0.06] bg-card animate-pulse">
            <p className="font-serif italic text-[18px] text-ink-faint m-0">
              Loading your saved pieces…
            </p>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="px-[8%] max-[900px]:px-[6%]">
          <WishEmpty />
        </div>
      ) : (
        <div className="px-[8%] max-[900px]:px-[6%]">
          {/* Bulk summary bar */}
          <div
            className={
              "flex items-center justify-between gap-6 p-6 rounded-[16px] mb-8 " +
              "border border-pink/[0.22] " +
              "bg-[linear-gradient(120deg,rgba(255,79,163,0.1),rgba(212,175,55,0.08))] " +
              "max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-4"
            }
          >
            <div>
              <p className="font-serif text-[22px] font-semibold text-ink m-0 leading-tight">
                {snapshot.length} piece{snapshot.length === 1 ? "" : "s"} saved
              </p>
              <p className="font-sans text-[13px] leading-[1.55] text-ink-dim m-0 mt-1.5 max-w-[440px]">
                Move them to your bag, or keep dreaming. We&apos;ll hold them here for you.
              </p>
            </div>
            <div className="text-right max-[560px]:text-left">
              <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-ink-faint block">
                Total
              </span>
              <span className="font-serif text-[22px] font-semibold text-ink">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-7 max-[560px]:flex-col max-[560px]:items-start">
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              >
                All
              </FilterChip>
              {categories.map((cat) => (
                <FilterChip
                  key={cat}
                  active={activeFilter === cat}
                  onClick={() => setActiveFilter(cat)}
                >
                  {cat}
                </FilterChip>
              ))}
            </div>
            <span className="font-sans text-[11px] tracking-[0.14em] uppercase text-ink-faint whitespace-nowrap">
              Showing {visible.length} of {snapshot.length}
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 gap-[22px] max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
            {visible.map((item) => (
              <WishCard
                key={item.productId}
                item={item}
                inBag={cartIds.has(item.productId)}
                removing={removingIds.has(item.productId)}
                onRemove={onRemove}
                onAdd={onAdd}
              />
            ))}
          </div>

          <WishRecs recs={recs} onAdd={onRecAdd} />
        </div>
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "inline-flex items-center py-2.5 px-4 rounded-full border cursor-pointer " +
        "font-sans text-xs font-semibold tracking-[0.12em] uppercase " +
        "transition-[background-color,color,border-color,transform,box-shadow] duration-200 " +
        (active
          ? "bg-ink text-canvas border-ink shadow-[0_6px_16px_rgba(255,79,163,0.18)] -translate-y-px"
          : "border-white/12 text-ink-dim bg-transparent hover:border-blush hover:text-ink light:border-[rgba(26,13,18,0.14)]")
      }
    >
      {children}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
