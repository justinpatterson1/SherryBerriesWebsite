"use client";

import type { AdminData } from "@/lib/queries/admin";
import { AdminCard, KpiCard, ProductThumb, money0 } from "@/components/admin/shared";
import { RevenueAreaChart, AcquisitionDonut, ShareBar } from "@/components/admin/charts";

export function AnalyticsView({ data }: { data: AdminData }) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-[30px] leading-none text-ink">Analytics</h1>
        <p className="mt-2 font-sans text-[13px] text-ink-dim">
          Product performance and revenue mix across the catalog.
        </p>
      </header>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {data.analyticsKpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <AdminCard title="Revenue trend" hint="Last 12 months">
          <RevenueAreaChart data={data.trend} />
        </AdminCard>
        <AdminCard title="Acquisition" hint="Where shoppers come from · est.">
          <AcquisitionDonut items={data.channels} />
        </AdminCard>
      </div>

      <AdminCard title="Top products by revenue" hint="All-time line-item revenue" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[2fr_0.8fr_0.8fr_1.4fr] gap-4 px-5 py-3 border-b border-white/[0.06] font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-ink-faint light:border-[rgba(26,13,18,0.06)]">
              <span>Product</span>
              <span className="text-right">Units</span>
              <span className="text-right">Revenue</span>
              <span>Share</span>
            </div>
            <ul>
              {data.topProducts.map((p) => (
                <li
                  key={p.id}
                  className="grid grid-cols-[2fr_0.8fr_0.8fr_1.4fr] gap-4 items-center px-5 py-3.5 border-b border-white/[0.04] last:border-0 light:border-[rgba(26,13,18,0.04)]"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="relative w-10 h-10 rounded-lg overflow-hidden bg-canvas-2 border border-white/10 shrink-0 light:border-[rgba(26,13,18,0.1)]">
                      <ProductThumb src={p.img} alt={p.name} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-sans text-[13px] font-medium text-ink truncate">{p.name}</span>
                      <span className="block font-sans text-[11px] text-ink-faint truncate">{p.sku}</span>
                    </span>
                  </span>
                  <span className="font-sans text-[13px] text-ink-dim text-right">{p.units}</span>
                  <span className="font-display text-[14px] text-ink text-right">{money0(p.revenue)}</span>
                  <span>
                    <ShareBar pct={p.pct} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
