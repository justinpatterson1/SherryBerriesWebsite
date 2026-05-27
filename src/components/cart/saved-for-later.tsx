"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CartSnapshotLine } from "@/app/api/cart/snapshot/route";
import type { SavedItem } from "@/lib/cart/local-extras";

export function SavedForLater({
  items,
  onMoveBack,
}: {
  items: SavedItem[];
  onMoveBack: (item: SavedItem) => void;
}) {
  const [enriched, setEnriched] = useState<CartSnapshotLine[] | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      queueMicrotask(() => setEnriched([]));
      return;
    }
    let cancelled = false;
    fetch("/api/cart/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((it) => ({ ...it, quantity: 1 })),
      }),
    })
      .then((r) => r.json())
      .then((data: { items: CartSnapshotLine[] }) => {
        if (!cancelled) setEnriched(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setEnriched([]);
      });
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (!enriched || enriched.length === 0) return null;

  return (
    <section aria-labelledby="saved-title">
      <header className="flex items-baseline justify-between gap-3 mb-5">
        <h2
          id="saved-title"
          className="font-display text-[28px] leading-none text-ink m-0"
        >
          Saved for{" "}
          <em className="font-serif italic text-blush font-medium">later</em>
        </h2>
        <span className="font-sans text-[11px] tracking-[0.18em] uppercase text-ink-faint">
          {enriched.length} {enriched.length === 1 ? "item" : "items"}
        </span>
      </header>

      <ul className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1 list-none p-0">
        {enriched.map((line) => (
          <li
            key={`${line.productId}::${line.variantId ?? ""}`}
            className="grid grid-cols-[90px_1fr_auto] items-center gap-3 p-3 rounded-2xl bg-card border border-white/[0.06] hover:border-pink/40 transition-colors duration-200"
          >
            <Link
              href={`/products/${line.productSlug}`}
              className="relative block w-[90px] aspect-square rounded-xl overflow-hidden bg-canvas-2 border border-white/[0.04]"
            >
              {line.imageUrl ? (
                <Image
                  src={line.imageUrl}
                  alt={line.productName}
                  fill
                  sizes="90px"
                  className="object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-br from-pink to-pink-deep"
                />
              )}
            </Link>
            <div className="flex flex-col gap-1.5 min-w-0">
              <Link
                href={`/products/${line.productSlug}`}
                className="font-serif text-[14px] leading-[1.3] text-ink no-underline hover:text-pink transition-colors line-clamp-2"
              >
                {line.productName}
              </Link>
              <span className="font-serif text-[15px] font-semibold text-ink">
                ${line.unitPrice.toFixed(2)}
              </span>
              {line.variantValue && (
                <span className="font-sans text-[10px] tracking-[0.16em] uppercase text-ink-faint">
                  {line.variantValue}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label={`Move ${line.productName} to bag`}
              onClick={() =>
                onMoveBack({ productId: line.productId, variantId: line.variantId })
              }
              className={
                "inline-flex w-9 h-9 items-center justify-center rounded-full " +
                "border border-pink bg-transparent text-pink font-sans text-lg leading-none cursor-pointer " +
                "transition-[background-color,color,transform] duration-200 " +
                "hover:bg-pink hover:text-white hover:-translate-y-px"
              }
            >
              +
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
