import "server-only";
import { prisma } from "@/lib/db";
import type {
  FulfillmentStatus,
  PaymentStatus,
} from "@/generated/prisma/client";
import type { AdminOrderStatus } from "@/lib/admin/status";

// -----------------------------------------------------------------------------
// Public shapes (everything the admin client renders)
// -----------------------------------------------------------------------------

export type { AdminOrderStatus };
export { ADMIN_STATUS_OPTIONS } from "@/lib/admin/status";

export type Kpi = {
  label: string;
  value: string;
  /** Signed percent change vs the prior period; null when there's no baseline. */
  delta: number | null;
  /** Small caption under the value (e.g. "month over month", "est."). */
  hint?: string;
};

export type TrendPoint = { label: string; full: string; revenue: number; orders: number };

export type CategorySale = { name: string; revenue: number; pct: number };

export type Channel = { label: string; value: number; color: string };

export type AdminOrderItem = {
  id: string;
  name: string;
  slug: string;
  variant: string | null;
  qty: number;
  price: number;
  lineTotal: number;
  img: string | null;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: AdminOrderStatus;
  date: string;
  customer: { name: string; email: string; initials: string };
  channel: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  items: AdminOrderItem[];
  needsAction: boolean;
};

export type StockStatus = "In stock" | "Low stock" | "Out of stock";

export type AdminProduct = {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryId: string;
  img: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  reorder: number;
  sold30: number;
  status: StockStatus;
  shortDescription: string;
  description: string;
  material: string | null;
  jewelryType: string;
  featured: boolean;
  active: boolean;
};

export type AdminCategory = { id: string; name: string };

export type TopProduct = {
  id: string;
  name: string;
  sku: string;
  img: string | null;
  revenue: number;
  units: number;
  pct: number;
};

export type AdminData = {
  overviewKpis: Kpi[];
  analyticsKpis: Kpi[];
  trend: TrendPoint[];
  categorySales: CategorySale[];
  channels: Channel[];
  orders: AdminOrder[];
  products: AdminProduct[];
  topProducts: TopProduct[];
  categories: AdminCategory[];
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

// Estimated COGS ratio — Product has no `cost` column, so cost-basis figures
// (inventory value at cost) are approximated. Flagged "est." in the UI.
const COST_RATIO = 0.45;

const dollars0 = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const dollars2 = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const monthShort = new Intl.DateTimeFormat("en-US", { month: "short" });
const monthFull = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b || a || "♡").toUpperCase();
}

function deriveStatus(f: FulfillmentStatus, p: PaymentStatus): AdminOrderStatus {
  if (p === "REFUNDED") return "Refunded";
  switch (f) {
    case "PROCESSING":
      return "Processing";
    case "SHIPPED":
      return "Shipped";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Pending"; // UNFULFILLED
  }
}

// An order contributes to revenue unless it was cancelled or refunded.
function countsAsRevenue(f: FulfillmentStatus, p: PaymentStatus): boolean {
  return f !== "CANCELLED" && p !== "REFUNDED";
}

function channelFor(paymentMethod: string | null): string {
  const m = (paymentMethod ?? "").toLowerCase();
  if (m.includes("cod") || m.includes("cash")) return "COD";
  if (m.includes("card") || m.includes("credit") || m.includes("wipay")) return "Card";
  return "Online";
}

function pctChange(current: number, prior: number): number | null {
  if (prior <= 0) return current > 0 ? 100 : null;
  return Number((((current - prior) / prior) * 100).toFixed(1));
}

// -----------------------------------------------------------------------------
// Main query
// -----------------------------------------------------------------------------

export async function getAdminData(): Promise<AdminData> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 864e5);
  // First day of the month, 11 months back → start of a trailing-12-month window.
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    lightOrders,
    recentOrderRows,
    itemRows,
    productRows,
    sold30Rows,
    categoryRows,
  ] = await Promise.all([
    // Light pass over every order — powers all-time totals + the monthly trend.
    prisma.order.findMany({
      select: {
        createdAt: true,
        total: true,
        fulfillmentStatus: true,
        paymentStatus: true,
      },
    }),
    // Recent orders for the Orders table + detail view.
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        user: { select: { name: true, firstName: true, lastName: true, email: true } },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: { orderBy: { position: "asc" }, take: 1, select: { imageUrl: true } },
              },
            },
            variant: { select: { value: true } },
          },
        },
      },
    }),
    // Every line item — powers category sales, top products, units, product revenue.
    prisma.orderItem.findMany({
      select: {
        quantity: true,
        price: true,
        productId: true,
        product: {
          select: {
            name: true,
            sku: true,
            category: { select: { name: true } },
            images: { orderBy: { position: "asc" }, take: 1, select: { imageUrl: true } },
          },
        },
        order: { select: { fulfillmentStatus: true, paymentStatus: true } },
      },
    }),
    // Catalog for the Inventory view.
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        compareAtPrice: true,
        inventory: true,
        lowStockThreshold: true,
        active: true,
        featured: true,
        material: true,
        shortDescription: true,
        description: true,
        jewelryType: true,
        categoryId: true,
        category: { select: { name: true } },
        images: { orderBy: { position: "asc" }, take: 1, select: { imageUrl: true } },
      },
    }),
    // Units sold per product over the trailing 30 days.
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: thirtyDaysAgo } } },
      _sum: { quantity: true },
    }),
    // Category options for the add/edit product form.
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // --- All-time + monthly trend ---------------------------------------------
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const buckets = new Map<string, { revenue: number; orders: number; date: Date }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(trendStart.getFullYear(), trendStart.getMonth() + i, 1);
    buckets.set(monthKey(d), { revenue: 0, orders: 0, date: d });
  }

  let allTimeRevenue = 0;
  const totalOrders = lightOrders.length;
  // Month-over-month: current calendar month vs the previous one.
  const curKey = monthKey(new Date(now.getFullYear(), now.getMonth(), 1));
  const prevKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  let curRev = 0;
  let prevRev = 0;
  let curOrders = 0;
  let prevOrders = 0;

  for (const o of lightOrders) {
    const revenue = countsAsRevenue(o.fulfillmentStatus, o.paymentStatus)
      ? Number(o.total)
      : 0;
    allTimeRevenue += revenue;

    const k = monthKey(o.createdAt);
    const bucket = buckets.get(k);
    if (bucket) {
      bucket.revenue += revenue;
      bucket.orders += 1;
    }
    if (k === curKey) {
      curRev += revenue;
      curOrders += 1;
    } else if (k === prevKey) {
      prevRev += revenue;
      prevOrders += 1;
    }
  }

  const trend: TrendPoint[] = [...buckets.values()].map((b) => ({
    label: monthShort.format(b.date),
    full: monthFull.format(b.date),
    revenue: Number(b.revenue.toFixed(2)),
    orders: b.orders,
  }));

  const aov = totalOrders > 0 ? allTimeRevenue / totalOrders : 0;
  const curAov = curOrders > 0 ? curRev / curOrders : 0;
  const prevAov = prevOrders > 0 ? prevRev / prevOrders : 0;

  const overviewKpis: Kpi[] = [
    {
      label: "Revenue",
      value: dollars0(allTimeRevenue),
      delta: pctChange(curRev, prevRev),
      hint: "all-time · MoM delta",
    },
    {
      label: "Orders",
      value: totalOrders.toLocaleString("en-US"),
      delta: pctChange(curOrders, prevOrders),
      hint: "all-time · MoM delta",
    },
    {
      label: "Avg Order Value",
      value: dollars2(aov),
      delta: pctChange(curAov, prevAov),
      hint: "month over month",
    },
    {
      label: "Conversion",
      value: "3.2%",
      delta: 0.4,
      hint: "est. — no traffic data",
    },
  ];

  // --- Category sales, top products, units, product revenue -----------------
  const catMap = new Map<string, number>();
  const prodMap = new Map<
    string,
    { name: string; sku: string; img: string | null; revenue: number; units: number }
  >();
  let unitsSold = 0;
  let productRevenue = 0;

  for (const it of itemRows) {
    if (!countsAsRevenue(it.order.fulfillmentStatus, it.order.paymentStatus)) continue;
    const line = Number(it.price) * it.quantity;
    unitsSold += it.quantity;
    productRevenue += line;

    const cat = it.product.category?.name ?? "Uncategorized";
    catMap.set(cat, (catMap.get(cat) ?? 0) + line);

    const existing = prodMap.get(it.productId);
    if (existing) {
      existing.revenue += line;
      existing.units += it.quantity;
    } else {
      prodMap.set(it.productId, {
        name: it.product.name,
        sku: it.product.sku,
        img: it.product.images[0]?.imageUrl ?? null,
        revenue: line,
        units: it.quantity,
      });
    }
  }

  const catTotal = [...catMap.values()].reduce((a, b) => a + b, 0) || 1;
  const categorySales: CategorySale[] = [...catMap.entries()]
    .map(([name, revenue]) => ({
      name,
      revenue: Number(revenue.toFixed(2)),
      pct: Math.round((revenue / catTotal) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const topTotal = productRevenue || 1;
  const topProducts: TopProduct[] = [...prodMap.entries()]
    .map(([id, p]) => ({
      id,
      name: p.name,
      sku: p.sku,
      img: p.img,
      revenue: Number(p.revenue.toFixed(2)),
      units: p.units,
      pct: Math.round((p.revenue / topTotal) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // --- Inventory ------------------------------------------------------------
  const sold30Map = new Map<string, number>();
  for (const r of sold30Rows) sold30Map.set(r.productId, r._sum.quantity ?? 0);

  let inventoryValueCost = 0;
  let activeSkus = 0;

  const products: AdminProduct[] = productRows.map((p) => {
    const stock = p.inventory;
    const reorder = p.lowStockThreshold;
    const price = Number(p.price);
    const status: StockStatus =
      stock <= 0 ? "Out of stock" : stock <= reorder ? "Low stock" : "In stock";
    inventoryValueCost += stock * price * COST_RATIO;
    if (p.active) activeSkus += 1;

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name ?? "Uncategorized",
      categoryId: p.categoryId,
      img: p.images[0]?.imageUrl ?? null,
      price,
      compareAtPrice: p.compareAtPrice == null ? null : Number(p.compareAtPrice),
      stock,
      reorder,
      sold30: sold30Map.get(p.id) ?? 0,
      status,
      shortDescription: p.shortDescription,
      description: p.description,
      material: p.material,
      jewelryType: p.jewelryType,
      featured: p.featured,
      active: p.active,
    };
  });

  const analyticsKpis: Kpi[] = [
    {
      label: "Units Sold",
      value: unitsSold.toLocaleString("en-US"),
      delta: null,
      hint: "all-time",
    },
    {
      label: "Product Revenue",
      value: dollars0(productRevenue),
      delta: null,
      hint: "all-time line items",
    },
    {
      label: "Inventory Value",
      value: dollars0(inventoryValueCost),
      delta: null,
      hint: "est. at cost",
    },
    {
      label: "Active SKUs",
      value: activeSkus.toLocaleString("en-US"),
      delta: null,
      hint: `of ${productRows.length} products`,
    },
  ];

  // --- Orders table ---------------------------------------------------------
  const orders: AdminOrder[] = recentOrderRows.map((o) => {
    const subtotal = Number(o.subtotal);
    const shippingFee = Number(o.shippingCost);
    const total = Number(o.total);
    const discount = Math.max(0, Number((subtotal + shippingFee - total).toFixed(2)));
    const status = deriveStatus(o.fulfillmentStatus, o.paymentStatus);
    const name =
      o.user.name ??
      [o.user.firstName, o.user.lastName].filter(Boolean).join(" ") ??
      o.user.email;

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status,
      date: shortDate.format(o.createdAt),
      customer: { name, email: o.user.email, initials: initials(name) },
      channel: channelFor(o.paymentMethod),
      paymentMethod: o.paymentMethod ?? "—",
      subtotal,
      shippingFee,
      discount,
      total,
      needsAction: status === "Pending" || status === "Processing",
      items: o.orderItems.map((it) => {
        const price = Number(it.price);
        return {
          id: it.id,
          name: it.product.name,
          slug: it.product.slug,
          variant: it.variant?.value ?? null,
          qty: it.quantity,
          price,
          lineTotal: Number((price * it.quantity).toFixed(2)),
          img: it.product.images[0]?.imageUrl ?? null,
        };
      }),
    };
  });

  // --- Acquisition channels (est. — no traffic source) ----------------------
  const channels: Channel[] = [
    { label: "Instagram", value: 38, color: "var(--color-pink)" },
    { label: "Direct", value: 24, color: "var(--color-gold)" },
    { label: "Google", value: 22, color: "var(--color-blush)" },
    { label: "Referral", value: 16, color: "var(--color-pink-deep)" },
  ];

  return {
    overviewKpis,
    analyticsKpis,
    trend,
    categorySales,
    channels,
    orders,
    products,
    topProducts,
    categories: categoryRows,
  };
}

// -----------------------------------------------------------------------------
// Single product → AdminProduct (used by the create/update API routes to return
// a fully-shaped row the client can merge into state).
// -----------------------------------------------------------------------------

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5);
  const [p, sold] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        compareAtPrice: true,
        inventory: true,
        lowStockThreshold: true,
        active: true,
        featured: true,
        material: true,
        shortDescription: true,
        description: true,
        jewelryType: true,
        categoryId: true,
        category: { select: { name: true } },
        images: { orderBy: { position: "asc" }, take: 1, select: { imageUrl: true } },
      },
    }),
    prisma.orderItem.aggregate({
      where: { productId: id, order: { createdAt: { gte: thirtyDaysAgo } } },
      _sum: { quantity: true },
    }),
  ]);
  if (!p) return null;

  const stock = p.inventory;
  const reorder = p.lowStockThreshold;
  let status: StockStatus;
  if (stock <= 0) status = "Out of stock";
  else if (stock <= reorder) status = "Low stock";
  else status = "In stock";

  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category?.name ?? "Uncategorized",
    categoryId: p.categoryId,
    img: p.images[0]?.imageUrl ?? null,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice == null ? null : Number(p.compareAtPrice),
    stock,
    reorder,
    sold30: sold._sum.quantity ?? 0,
    status,
    shortDescription: p.shortDescription,
    description: p.description,
    material: p.material,
    jewelryType: p.jewelryType,
    featured: p.featured,
    active: p.active,
  };
}
