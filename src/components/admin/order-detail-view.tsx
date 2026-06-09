"use client";

import { useEffect, useState } from "react";
import { ADMIN_STATUS_OPTIONS, type AdminOrderStatus } from "@/lib/admin/status";
import type { AdminOrder } from "@/lib/queries/admin";
import {
  AdminCard,
  OrderStatusBadge,
  ProductThumb,
  money,
  btnSolid,
  ICONS,
} from "@/components/admin/shared";

export function OrderDetailView({
  order,
  onBack,
  onUpdateStatus,
}: {
  order: AdminOrder | null;
  onBack: () => void;
  onUpdateStatus: (id: string, status: AdminOrderStatus) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<AdminOrderStatus>(order?.status ?? "Pending");
  const [busy, setBusy] = useState(false);

  // Re-sync the <select> when a different order is opened (React 19: defer the
  // setState out of the effect body — same pattern the account views use).
  const orderStatus = order?.status;
  useEffect(() => {
    if (orderStatus) queueMicrotask(() => setSelected(orderStatus));
  }, [orderStatus]);

  if (!order) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink onBack={onBack} />
        <AdminCard>
          <p className="font-sans text-[13px] text-ink-faint">That order is no longer available.</p>
        </AdminCard>
      </div>
    );
  }

  const dirty = selected !== order.status;

  const handleUpdate = async () => {
    setBusy(true);
    await onUpdateStatus(order.id, selected);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <BackLink onBack={onBack} />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] leading-none text-ink">{order.orderNumber}</h1>
          <p className="mt-2 font-sans text-[13px] text-ink-dim">Placed {order.date}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Line items + totals */}
        <AdminCard title="Items" bodyClassName="p-0">
          <ul>
            {order.items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] last:border-0 light:border-[rgba(26,13,18,0.04)]"
              >
                <span className="relative w-14 h-14 rounded-xl overflow-hidden bg-canvas-2 border border-white/10 shrink-0 light:border-[rgba(26,13,18,0.1)]">
                  <ProductThumb src={it.img} alt={it.name} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-sans text-[14px] font-medium text-ink truncate">{it.name}</span>
                  <span className="block font-sans text-[12px] text-ink-faint">
                    {it.variant ? `${it.variant} · ` : ""}
                    {it.qty} × {money(it.price)}
                  </span>
                </span>
                <span className="font-display text-[15px] text-ink shrink-0">{money(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="px-6 py-5 flex flex-col gap-2 border-t border-white/[0.06] light:border-[rgba(26,13,18,0.06)]">
            <Row label="Subtotal" value={money(order.subtotal)} />
            <Row label="Shipping" value={order.shippingFee === 0 ? "Free" : money(order.shippingFee)} />
            {order.discount > 0 && <Row label="Discount" value={`− ${money(order.discount)}`} accent />}
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/[0.06] light:border-[rgba(26,13,18,0.06)]">
              <span className="font-sans text-[12px] font-bold tracking-[0.12em] uppercase text-ink-faint">
                Total
              </span>
              <span className="font-display text-[22px] text-ink">{money(order.total)}</span>
            </div>
          </div>
        </AdminCard>

        {/* Customer + status control */}
        <div className="flex flex-col gap-6">
          <AdminCard title="Customer">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 grid place-items-center rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[13px] font-bold shrink-0">
                {order.customer.initials}
              </span>
              <div className="min-w-0">
                <div className="font-sans text-[14px] font-medium text-ink truncate">{order.customer.name}</div>
                <div className="font-sans text-[12px] text-ink-faint truncate">{order.customer.email}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-2 light:border-[rgba(26,13,18,0.06)]">
              <Row label="Channel" value={order.channel} />
              <Row label="Payment" value={order.paymentMethod} />
            </div>
          </AdminCard>

          <AdminCard title="Fulfillment">
            <label className="block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-2">
              Update status
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value as AdminOrderStatus)}
              className="w-full h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink outline-none transition-[border-color] duration-200 focus:border-pink light:bg-white light:border-[rgba(26,13,18,0.12)]"
            >
              {ADMIN_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={!dirty || busy}
              className={`${btnSolid} w-full mt-3`}
            >
              {busy ? "Saving…" : "Update status"}
            </button>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-sans text-[12px] text-ink-faint">{label}</span>
      <span className={`font-sans text-[13px] ${accent ? "text-blush" : "text-ink-dim"}`}>{value}</span>
    </div>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1.5 font-sans text-[12px] font-bold tracking-[0.1em] uppercase text-ink-faint cursor-pointer transition-colors duration-200 hover:text-blush [&_svg]:w-4 [&_svg]:h-4 self-start"
    >
      {ICONS.back}
      Back to orders
    </button>
  );
}
