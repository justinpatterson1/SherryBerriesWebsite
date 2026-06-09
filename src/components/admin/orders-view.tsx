"use client";

import { useMemo, useState } from "react";
import type { AdminOrder, AdminOrderStatus } from "@/lib/queries/admin";
import { AdminCard, OrderStatusBadge, ProductThumb, money, ICONS } from "@/components/admin/shared";

const TABS: (AdminOrderStatus | "All")[] = [
  "All",
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];

function Thumbs({ items }: { items: AdminOrder["items"] }) {
  const shown = items.slice(0, 3);
  const extra = items.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-3">
        {shown.map((it) => (
          <span
            key={it.id}
            className="w-9 h-9 rounded-lg border border-white/12 bg-canvas-2 overflow-hidden ring-2 ring-card light:border-[rgba(26,13,18,0.1)]"
            title={it.name}
          >
            <ProductThumb src={it.img} alt={it.name} />
          </span>
        ))}
      </div>
      {extra > 0 && <span className="ml-2 font-sans text-[11px] text-ink-faint">+{extra}</span>}
    </div>
  );
}

export function OrdersView({
  orders,
  onOpenOrder,
}: {
  orders: AdminOrder[];
  onOpenOrder: (id: string) => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== "All" && o.status !== tab) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q)
      );
    });
  }, [orders, tab, query]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-[30px] leading-none text-ink">Orders</h1>
        <p className="mt-2 font-sans text-[13px] text-ink-dim">
          {orders.length} most recent orders. Click any row to manage it.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative max-w-[420px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint [&_svg]:w-[18px] [&_svg]:h-[18px]">
            {ICONS.search}
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order #, customer, or email"
            className="w-full h-11 pl-11 pr-3.5 rounded-full border border-white/12 bg-white/[0.03] font-sans text-[13px] text-ink placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink light:bg-white light:border-[rgba(26,13,18,0.12)]"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const active = tab === t;
            const count = counts[t] ?? 0;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  "inline-flex items-center gap-2 py-2 px-3.5 rounded-full whitespace-nowrap cursor-pointer " +
                  "font-sans text-[12px] font-bold tracking-[0.08em] uppercase border transition-colors duration-200 " +
                  (active
                    ? "bg-ink text-canvas border-ink"
                    : "bg-transparent text-ink-dim border-white/12 hover:text-ink hover:border-blush light:border-[rgba(26,13,18,0.12)]")
                }
              >
                {t}
                <span
                  className={
                    "grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] " +
                    (active ? "bg-canvas/20 text-canvas" : "bg-white/[0.08] text-ink-faint light:bg-[rgba(26,13,18,0.08)]")
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AdminCard bodyClassName="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Head */}
            <div className="grid grid-cols-[1.6fr_1.1fr_0.8fr_0.9fr_0.8fr] gap-4 px-5 py-3 border-b border-white/[0.06] font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-ink-faint light:border-[rgba(26,13,18,0.06)]">
              <span>Customer</span>
              <span>Items</span>
              <span>Channel</span>
              <span>Status</span>
              <span className="text-right">Total</span>
            </div>
            {filtered.length === 0 ? (
              <p className="p-8 text-center font-sans text-[13px] text-ink-faint">
                No orders match your filters.
              </p>
            ) : (
              <ul>
                {filtered.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => onOpenOrder(o.id)}
                      className="w-full grid grid-cols-[1.6fr_1.1fr_0.8fr_0.9fr_0.8fr] gap-4 items-center px-5 py-3.5 text-left cursor-pointer border-b border-white/[0.04] transition-colors duration-150 hover:bg-white/[0.04] last:border-0 light:border-[rgba(26,13,18,0.04)] light:hover:bg-[rgba(26,13,18,0.04)]"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 grid place-items-center rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[11px] font-bold shrink-0">
                          {o.customer.initials}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-sans text-[13px] font-medium text-ink truncate">
                            {o.customer.name}
                          </span>
                          <span className="block font-sans text-[11px] text-ink-faint truncate">
                            {o.orderNumber} · {o.customer.email}
                          </span>
                        </span>
                      </span>
                      <span>
                        <Thumbs items={o.items} />
                      </span>
                      <span className="font-sans text-[12px] text-ink-dim">{o.channel}</span>
                      <span>
                        <OrderStatusBadge status={o.status} />
                      </span>
                      <span className="font-display text-[15px] text-ink text-right">{money(o.total)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
