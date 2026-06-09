"use client";

import type { AdminData, AdminOrder } from "@/lib/queries/admin";
import { AdminCard, KpiCard, OrderStatusBadge, money, btnGhost, ICONS } from "@/components/admin/shared";
import { RevenueAreaChart, CategoryBars, AcquisitionDonut } from "@/components/admin/charts";

export function OverviewView({
  data,
  orders,
  onOpenOrder,
  onSeeAll,
}: {
  data: AdminData;
  orders: AdminOrder[];
  onOpenOrder: (id: string) => void;
  onSeeAll: () => void;
}) {
  const attention = orders.filter((o) => o.needsAction).slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-[30px] leading-none text-ink">Overview</h1>
        <p className="mt-2 font-sans text-[13px] text-ink-dim">
          A live pulse on revenue, orders, and what needs your attention.
        </p>
      </header>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {data.overviewKpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>

      <AdminCard title="Revenue trend" hint="Last 12 months">
        <RevenueAreaChart data={data.trend} />
      </AdminCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard title="Sales by category" hint="Share of product revenue">
          <CategoryBars items={data.categorySales} />
        </AdminCard>
        <AdminCard title="Acquisition" hint="Where shoppers come from · est.">
          <AcquisitionDonut items={data.channels} />
        </AdminCard>
      </div>

      <AdminCard
        title="Needs attention"
        hint="Orders awaiting fulfillment"
        action={
          <button type="button" className={btnGhost} onClick={onSeeAll}>
            View all
            <span className="[&_svg]:w-3.5 [&_svg]:h-3.5">{ICONS.chevron}</span>
          </button>
        }
        bodyClassName="p-2"
      >
        {attention.length === 0 ? (
          <p className="p-6 font-sans text-[13px] text-ink-faint">
            Nothing pending — every order is on its way. ✦
          </p>
        ) : (
          <ul className="flex flex-col">
            {attention.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onOpenOrder(o.id)}
                  className="w-full flex items-center gap-4 py-3 px-4 rounded-xl text-left cursor-pointer transition-colors duration-150 hover:bg-white/[0.04] light:hover:bg-[rgba(26,13,18,0.04)]"
                >
                  <span className="w-9 h-9 grid place-items-center rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[11px] font-bold shrink-0">
                    {o.customer.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-sans text-[13px] font-medium text-ink truncate">
                      {o.customer.name}
                    </span>
                    <span className="block font-sans text-[11px] text-ink-faint truncate">
                      {o.orderNumber} · {o.date}
                    </span>
                  </span>
                  <OrderStatusBadge status={o.status} />
                  <span className="font-display text-[15px] text-ink w-20 text-right shrink-0">
                    {money(o.total)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
