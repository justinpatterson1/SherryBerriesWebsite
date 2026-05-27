"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartSnapshotLine } from "@/app/api/cart/snapshot/route";

const cardClass =
  "relative grid grid-cols-[140px_1fr_auto] gap-5 p-5 pr-12 rounded-[20px] border border-white/[0.06] " +
  "bg-card transition-[transform,border-color,opacity] duration-[280ms] " +
  "hover:border-pink/40 " +
  "max-[640px]:grid-cols-[100px_1fr] max-[640px]:gap-4 max-[640px]:pr-10";

export function CartRow({
  line,
  giftWrap,
  removing,
  onQtyChange,
  onRemove,
  onSaveForLater,
  onToggleGiftWrap,
}: {
  line: CartSnapshotLine;
  giftWrap: boolean;
  removing: boolean;
  onQtyChange: (productId: string, variantId: string | null, qty: number) => void;
  onRemove: (productId: string, variantId: string | null) => void;
  onSaveForLater: (productId: string, variantId: string | null) => void;
  onToggleGiftWrap: (productId: string, variantId: string | null) => void;
}) {
  const inv =
    line.variantInventory != null ? line.variantInventory : line.productInventory;
  const low = inv > 0 && inv <= line.lowStockThreshold;
  const out = inv <= 0;

  const unit = line.unitPrice;
  const baseCompare = line.compareAtPrice;
  const lineTotal = unit * line.quantity;

  return (
    <article
      className={
        cardClass +
        " " +
        (removing
          ? "opacity-0 translate-x-10 pointer-events-none"
          : "opacity-100 translate-x-0")
      }
    >
      <button
        type="button"
        aria-label={`Remove ${line.productName} from bag`}
        onClick={() => onRemove(line.productId, line.variantId)}
        className={
          "absolute top-3 right-3 z-[2] inline-flex w-9 h-9 items-center justify-center " +
          "rounded-full border border-white/12 bg-white/[0.04] text-ink-dim " +
          "cursor-pointer transition-[color,border-color,background-color,transform] duration-200 " +
          "hover:text-white hover:border-pink hover:bg-gradient-to-br hover:from-pink hover:to-pink-deep " +
          "hover:-translate-y-px " +
          "light:bg-[rgba(26,13,18,0.04)] light:border-[rgba(26,13,18,0.12)] " +
          "max-[640px]:w-8 max-[640px]:h-8"
        }
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
          className="w-3.5 h-3.5"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>

      <Link
        href={`/products/${line.productSlug}`}
        className="relative block aspect-square rounded-[14px] overflow-hidden bg-canvas-2 border border-white/[0.04]"
      >
        {line.imageUrl ? (
          <Image
            src={line.imageUrl}
            alt={line.productName}
            fill
            sizes="(max-width: 640px) 100px, 140px"
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-pink to-pink-deep"
          />
        )}
        {giftWrap && (
          <span className="absolute top-1.5 left-1.5 z-[2] py-1 px-2 rounded-full bg-gradient-to-br from-gold-soft to-gold text-[#2a1a05] font-sans text-[9px] font-bold tracking-[0.14em] uppercase leading-none">
            ★ Gift
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-2.5 min-w-0">
        <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-blush">
          {line.categoryName}
        </span>
        <Link
          href={`/products/${line.productSlug}`}
          className="font-serif text-[19px] leading-[1.25] text-ink no-underline hover:text-pink transition-colors"
        >
          {line.productName}
        </Link>

        {line.variantValue && (
          <div className="font-sans text-[12px] text-ink-faint">
            Size:{" "}
            <strong className="text-ink font-semibold">{line.variantValue}</strong>
            {line.variantAdditional > 0 && (
              <span className="text-ink-faint ml-1">
                (+${line.variantAdditional.toFixed(2)})
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 font-sans text-[10px] tracking-[0.18em] uppercase mt-1">
          <span
            className={
              "inline-flex h-[6px] w-[6px] rounded-full " +
              (out
                ? "bg-[#d63a3a]"
                : low
                ? "bg-gold-soft shadow-[0_0_10px_rgba(212,175,55,0.6)]"
                : "bg-[#3aa86b] shadow-[0_0_10px_rgba(58,168,107,0.6)]")
            }
          />
          <span
            className={
              out
                ? "text-[#d63a3a]"
                : low
                ? "text-gold-soft"
                : "text-ink-dim"
            }
          >
            {out
              ? "Out of stock"
              : low
              ? `Only ${inv} left — last chance`
              : "In stock · ships in 2 days"}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
          <RowAction
            onClick={() => onSaveForLater(line.productId, line.variantId)}
          >
            ♡ Save for later
          </RowAction>
          <RowAction
            onClick={() => onToggleGiftWrap(line.productId, line.variantId)}
          >
            {giftWrap ? "✕ Remove gift wrap" : "🎁 Add gift wrap (+$6)"}
          </RowAction>
        </div>
      </div>

      <div
        className={
          "flex flex-col items-end justify-between gap-3 " +
          "max-[640px]:col-span-2 max-[640px]:flex-row max-[640px]:items-center max-[640px]:justify-between max-[640px]:border-t max-[640px]:border-white/[0.06] max-[640px]:pt-3"
        }
      >
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-2">
            {baseCompare && baseCompare > line.basePrice && (
              <span className="font-sans text-[13px] text-ink-faint line-through">
                ${(baseCompare * line.quantity).toFixed(2)}
              </span>
            )}
            <span className="font-serif text-[22px] font-semibold text-ink leading-none">
              ${lineTotal.toFixed(2)}
            </span>
          </div>
          {line.quantity > 1 && (
            <span className="font-sans text-[10px] tracking-[0.16em] uppercase text-ink-faint mt-1">
              ${unit.toFixed(2)} each
            </span>
          )}
        </div>

        <div className="inline-flex items-center self-end rounded-full border border-white/12 bg-white/[0.03] overflow-hidden max-[640px]:self-auto">
          <QtyButton
            label="Decrease quantity"
            onClick={() =>
              onQtyChange(line.productId, line.variantId, line.quantity - 1)
            }
            disabled={line.quantity <= 1}
          >
            −
          </QtyButton>
          <span
            aria-live="polite"
            className="px-3 py-1.5 font-sans text-[13px] font-bold text-ink min-w-[28px] text-center"
          >
            {line.quantity}
          </span>
          <QtyButton
            label="Increase quantity"
            onClick={() =>
              onQtyChange(line.productId, line.variantId, line.quantity + 1)
            }
            disabled={line.quantity >= 10}
          >
            +
          </QtyButton>
        </div>
      </div>
    </article>
  );
}

function RowAction({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "bg-transparent border-0 p-0 cursor-pointer " +
        "font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-ink-faint " +
        "transition-colors duration-200 hover:text-blush"
      }
    >
      {children}
    </button>
  );
}

function QtyButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={
        "w-[34px] h-[38px] inline-flex items-center justify-center text-ink font-sans text-base " +
        "bg-transparent border-0 cursor-pointer transition-[color,background-color] duration-200 " +
        "hover:text-pink hover:bg-pink/[0.06] " +
        "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      }
    >
      {children}
    </button>
  );
}
