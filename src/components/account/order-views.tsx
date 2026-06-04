"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { AccountAddress, AccountOrder } from "@/lib/queries/account";
import { StatusBadge, btnOutline, btnSolid, cardClass, money, type View } from "./shared";

// --- shared bits ------------------------------------------------------------

function Thumb({ src, alt, size = 56 }: { src: string | null; alt: string; size?: number }) {
  return (
    <span
      className="relative flex-none rounded-[10px] overflow-hidden border border-white/[0.06] bg-canvas-2 light:border-[rgba(26,13,18,0.08)]"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes="80px" className="object-cover" />
      ) : (
        <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,79,163,0.25),rgba(212,175,55,0.18))]" />
      )}
    </span>
  );
}

function ViewHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-[30px] leading-tight text-ink m-0">{title}</h2>
      {sub && <p className="font-sans text-[13px] text-ink-dim m-0 mt-1.5">{sub}</p>}
    </div>
  );
}

function Empty({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className={cardClass + " text-center py-14"}>
      <div className="mx-auto mb-4 inline-flex w-14 h-14 items-center justify-center rounded-full bg-pink/[0.1] text-pink text-[26px]">
        {icon}
      </div>
      <h3 className="font-display text-[24px] text-ink m-0 mb-2">{title}</h3>
      <p className="font-sans text-[14px] text-ink-dim m-0 max-w-[360px] mx-auto">{body}</p>
    </div>
  );
}

// --- Dashboard --------------------------------------------------------------

export function DashboardView({
  orders,
  totalOrders,
  inProgress,
  completed,
  onGoto,
  onOpenOrder,
}: {
  orders: AccountOrder[];
  totalOrders: number;
  inProgress: number;
  completed: number;
  onGoto: (v: View) => void;
  onOpenOrder: (id: string) => void;
}) {
  const recent = orders.slice(0, 4);
  return (
    <div>
      <ViewHead title="Dashboard" sub="A quick look at your SherryBerries world." />

      <div className="grid grid-cols-3 gap-4 mb-6 max-[640px]:grid-cols-1">
        <Stat icon="◇" value={totalOrders} label="Total orders" />
        <Stat icon="✦" value={inProgress} label="In progress" />
        <Stat icon="✓" value={completed} label="Completed" />
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[22px] text-ink m-0">Recent orders</h3>
          {orders.length > 0 && (
            <button
              type="button"
              onClick={() => onGoto("orders")}
              className="bg-transparent border-0 cursor-pointer font-sans text-[12px] font-bold tracking-[0.12em] uppercase text-blush hover:text-pink transition-colors"
            >
              View all →
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            No orders yet — your pieces will appear here.
          </p>
        ) : (
          <div className="flex flex-col">
            {recent.map((o, i) => (
              <div
                key={o.id}
                className={
                  "flex items-center gap-4 py-3.5 max-[560px]:flex-wrap " +
                  (i > 0 ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]" : "")
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-sans text-[14px] font-semibold text-ink">
                      {o.orderNumber}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="font-sans text-[12px] text-ink-faint m-0 mt-1">
                    {o.dateLabel} · {o.items.length} item{o.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="font-serif text-[17px] font-semibold text-ink">
                  {money(o.total)}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenOrder(o.id)}
                  className="bg-transparent border-0 cursor-pointer font-sans text-[12px] font-bold tracking-[0.1em] uppercase text-blush hover:text-pink transition-colors whitespace-nowrap"
                >
                  View details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className={cardClass + " relative overflow-hidden"}>
      <span
        aria-hidden="true"
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-[radial-gradient(circle,rgba(255,79,163,0.22),transparent_70%)] pointer-events-none"
      />
      <div className="relative">
        <span className="inline-flex w-10 h-10 items-center justify-center rounded-[12px] bg-pink/[0.12] text-pink text-[18px] mb-3">
          {icon}
        </span>
        <p className="font-display text-[40px] leading-none text-ink m-0">{value}</p>
        <p className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-ink-faint m-0 mt-2">
          {label}
        </p>
      </div>
    </div>
  );
}

// --- Orders -----------------------------------------------------------------

export function OrdersView({
  orders,
  onOpenOrder,
  onTrack,
}: {
  orders: AccountOrder[];
  onOpenOrder: (id: string) => void;
  onTrack: (id: string) => void;
}) {
  return (
    <div>
      <ViewHead title="Orders" sub={`${orders.length} order${orders.length === 1 ? "" : "s"} placed.`} />
      {orders.length === 0 ? (
        <Empty icon="◇" title="No orders yet" body="When you place an order, it'll show up here with tracking and details." />
      ) : (
        <div className="flex flex-col gap-3.5">
          {orders.map((o) => (
            <article
              key={o.id}
              className={
                "grid grid-cols-[1fr_auto] gap-5 p-5 rounded-[18px] border border-white/[0.06] bg-card " +
                "transition-[border-color] duration-200 hover:border-pink/30 " +
                "light:border-[rgba(26,13,18,0.08)] max-[560px]:grid-cols-1"
              }
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-sans text-[15px] font-semibold text-ink">
                    {o.orderNumber}
                  </span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="font-sans text-[12px] text-ink-faint m-0 mt-1">
                  {o.dateLabel} · {o.paymentMethod}
                </p>
                <div className="flex items-center gap-2 mt-3.5">
                  {o.items.slice(0, 4).map((it) => (
                    <Thumb key={it.id} src={it.img} alt={it.name} />
                  ))}
                  {o.items.length > 4 && (
                    <span className="flex-none w-14 h-14 grid place-items-center rounded-[10px] border border-white/[0.06] bg-canvas-2 font-sans text-[13px] font-semibold text-ink-dim light:border-[rgba(26,13,18,0.08)]">
                      +{o.items.length - 4}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between gap-3 max-[560px]:flex-row max-[560px]:items-center">
                <span className="font-serif text-[22px] font-semibold text-ink">
                  {money(o.total)}
                </span>
                <div className="flex gap-2">
                  {o.status !== "Cancelled" && (
                    <button type="button" onClick={() => onTrack(o.id)} className={btnOutline}>
                      Track
                    </button>
                  )}
                  <button type="button" onClick={() => onOpenOrder(o.id)} className={btnSolid}>
                    View details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Order detail -----------------------------------------------------------

const TRACK_STAGES = ["Pending", "Processing", "Packed", "Shipped", "Delivered"];

export function OrderDetailView({
  order,
  shipTo,
  onBack,
  onStartReturn,
}: {
  order: AccountOrder | null;
  shipTo: AccountAddress | null;
  onBack: () => void;
  onStartReturn: (orderId: string) => void;
}) {
  if (!order) {
    return (
      <div>
        <BackLink onBack={onBack} />
        <Empty icon="◇" title="Order not found" body="Head back to your orders to pick one." />
      </div>
    );
  }

  return (
    <div>
      <BackLink onBack={onBack} />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h2 className="font-display text-[30px] leading-tight text-ink m-0">
          {order.orderNumber}
        </h2>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 max-[640px]:grid-cols-1">
        <div className={cardClass}>
          <CardTitle>Order info</CardTitle>
          <Row label="Order number" value={order.orderNumber} />
          <Row label="Date placed" value={order.dateLabel} />
          <Row label="Payment" value={order.paymentMethod} />
          <Row label="Status" value={order.status} last />
        </div>
        <div className={cardClass}>
          <CardTitle>Shipping</CardTitle>
          {shipTo ? (
            <>
              <Row label="Recipient" value={shipTo.fullName} />
              <Row
                label="Address"
                value={
                  <span className="text-right">
                    {shipTo.line1}
                    {shipTo.line2 ? <><br />{shipTo.line2}</> : null}
                    <br />
                    {[shipTo.city, shipTo.region].filter(Boolean).join(", ")}
                    <br />
                    {shipTo.country}
                  </span>
                }
              />
              <Row label="Contact" value={shipTo.phone || "—"} last />
            </>
          ) : (
            <p className="font-sans text-[13px] text-ink-dim m-0">
              No saved address on file.
            </p>
          )}
        </div>
      </div>

      {/* Items + totals */}
      <div className={cardClass + " mb-4"}>
        <CardTitle>Items</CardTitle>
        <div className="flex flex-col">
          {order.items.map((it, i) => (
            <div
              key={it.id}
              className={
                "flex items-center gap-4 py-3.5 " +
                (i > 0 ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]" : "")
              }
            >
              <Thumb src={it.img} alt={it.name} size={60} />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[14px] font-semibold text-ink m-0 truncate">
                  {it.name}
                </p>
                {it.variant && (
                  <p className="font-sans text-[12px] text-ink-faint m-0 mt-0.5">{it.variant}</p>
                )}
                <p className="font-sans text-[12px] text-ink-dim m-0 mt-0.5">
                  Qty: {it.qty} · {money(it.price)} each
                </p>
              </div>
              <span className="font-serif text-[16px] font-semibold text-ink">
                {money(it.lineTotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]">
          <TotalRow label="Subtotal" value={money(order.subtotal)} />
          <TotalRow
            label="Shipping"
            value={order.shippingFee === 0 ? "Free" : money(order.shippingFee)}
          />
          {order.discount > 0 && (
            <TotalRow label="Discount" value={`−${money(order.discount)}`} blush />
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]">
            <span className="font-sans text-[13px] font-semibold tracking-[0.04em] uppercase text-ink-dim">
              Total
            </span>
            <span className="font-serif text-[26px] font-semibold text-ink">
              {money(order.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Tracking timeline (skip when cancelled) */}
      {order.stageIndex >= 0 && (
        <div className={cardClass + " mb-4"}>
          <CardTitle>Tracking</CardTitle>
          {order.trackingNumber && (
            <p className="font-sans text-[12px] text-ink-faint m-0 mb-4 -mt-1">
              Tracking #{order.trackingNumber}
            </p>
          )}
          <ol className="flex flex-col">
            {TRACK_STAGES.map((stage, i) => {
              const done = i < order.stageIndex;
              const current = i === order.stageIndex;
              const isLast = i === TRACK_STAGES.length - 1;
              const caption = done || current ? "Completed" : "Upcoming";
              const currentCaption =
                current && order.status === "Delivered"
                  ? "Completed"
                  : current
                    ? "In progress"
                    : caption;
              return (
                <li key={stage} className="grid grid-cols-[24px_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={
                        "w-3.5 h-3.5 rounded-full border-2 " +
                        (done
                          ? "bg-pink border-pink"
                          : current
                            ? "bg-pink border-pink shadow-[0_0_0_5px_rgba(255,79,163,0.25)]"
                            : "bg-transparent border-line-strong")
                      }
                    />
                    {!isLast && (
                      <span
                        className={
                          "w-0.5 flex-1 my-1 min-h-[26px] " +
                          (i < order.stageIndex ? "bg-pink" : "bg-line-strong")
                        }
                      />
                    )}
                  </div>
                  <div className={isLast ? "" : "pb-2"}>
                    <p
                      className={
                        "font-sans text-[14px] font-semibold m-0 " +
                        (done || current ? "text-ink" : "text-ink-faint")
                      }
                    >
                      {stage}
                    </p>
                    <p className="font-sans text-[12px] text-ink-faint m-0 mt-0.5">
                      {current ? currentCaption : caption}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {order.returnEligible && (
        <button type="button" onClick={() => onStartReturn(order.id)} className={btnOutline}>
          ↩ Request a return
        </button>
      )}
    </div>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-2 mb-5 bg-transparent border-0 cursor-pointer font-sans text-[11px] font-medium tracking-[0.18em] uppercase text-ink-faint hover:text-blush transition-colors"
    >
      <span aria-hidden="true">←</span> Back to orders
    </button>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-sans text-[11px] font-bold tracking-[0.16em] uppercase text-ink-faint m-0 mb-4">
      {children}
    </h3>
  );
}

function Row({ label, value, last }: { label: string; value: ReactNode; last?: boolean }) {
  return (
    <div
      className={
        "flex items-start justify-between gap-4 py-2.5 " +
        (last
          ? ""
          : "border-b border-dashed border-white/[0.1] light:border-[rgba(26,13,18,0.12)]")
      }
    >
      <span className="font-sans text-[12px] tracking-[0.06em] uppercase text-ink-faint flex-none">
        {label}
      </span>
      <span className="font-sans text-[13px] text-ink text-right">{value}</span>
    </div>
  );
}

function TotalRow({ label, value, blush }: { label: string; value: string; blush?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-sans text-[13px] text-ink-dim">{label}</span>
      <span className={"font-sans text-[13px] " + (blush ? "text-blush font-semibold" : "text-ink")}>
        {value}
      </span>
    </div>
  );
}
