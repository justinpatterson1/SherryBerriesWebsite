"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminData, AdminOrder, AdminOrderStatus, AdminProduct } from "@/lib/queries/admin";
import type { ProductFormData } from "@/lib/admin/options";
import { ICONS } from "@/components/admin/shared";
import { OverviewView } from "@/components/admin/overview-view";
import { OrdersView } from "@/components/admin/orders-view";
import { OrderDetailView } from "@/components/admin/order-detail-view";
import { InventoryView } from "@/components/admin/inventory-view";
import { AnalyticsView } from "@/components/admin/analytics-view";

type View = "overview" | "orders" | "order-detail" | "inventory" | "analytics";

const THEME_KEY = "sb-theme";

const SIDEBAR: { view: View; label: string; icon: keyof typeof ICONS }[] = [
  { view: "overview", label: "Overview", icon: "overview" },
  { view: "orders", label: "Orders", icon: "orders" },
  { view: "inventory", label: "Inventory", icon: "inventory" },
  { view: "analytics", label: "Analytics", icon: "analytics" },
];

export function AdminClient({
  data,
  admin,
}: {
  data: AdminData;
  admin: { name: string; email: string };
}) {
  const [view, setView] = useState<View>("overview");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [confirmDiscard, setConfirmDiscard] = useState<null | (() => void)>(null);

  // Live, editable copies so status updates + inventory edits re-render in place.
  const [orders, setOrders] = useState<AdminOrder[]>(data.orders);
  const [products, setProducts] = useState<AdminProduct[]>(data.products);

  // Toast
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // Theme: persisted to localStorage["sb-theme"], applied to <html data-theme>.
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") {
      queueMicrotask(() => setTheme(stored));
    }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggleTheme = () =>
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_KEY, next);
      return next;
    });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  const goto = useCallback((v: View) => {
    setView(v);
  }, []);

  const openOrder = useCallback((id: string) => {
    setSelectedOrderId(id);
    setView("order-detail");
  }, []);

  // --- Mutations ------------------------------------------------------------
  const updateOrderStatus = useCallback(
    async (id: string, status: AdminOrderStatus): Promise<boolean> => {
      try {
        const res = await fetch("/api/admin/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: id, status }),
        });
        if (!res.ok) throw new Error();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id
              ? { ...o, status, needsAction: status === "Pending" || status === "Processing" }
              : o,
          ),
        );
        showToast(`Order updated to ${status}`);
        return true;
      } catch {
        showToast("Couldn't update the order. Try again.");
        return false;
      }
    },
    [showToast],
  );

  const saveInventory = useCallback(
    async (edits: { id: string; price: number; stock: number }[]): Promise<boolean> => {
      try {
        const res = await fetch("/api/admin/inventory", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ edits }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error();
        const map = new Map<string, { price: number; stock: number; status: AdminProduct["status"] }>(
          json.products.map((p: { id: string; price: number; stock: number; status: AdminProduct["status"] }) => [
            p.id,
            p,
          ]),
        );
        setProducts((prev) =>
          prev.map((p) => {
            const u = map.get(p.id);
            return u ? { ...p, price: u.price, stock: u.stock, status: u.status } : p;
          }),
        );
        showToast(`Saved ${edits.length} change${edits.length === 1 ? "" : "s"}`);
        return true;
      } catch {
        showToast("Couldn't save changes. Try again.");
        return false;
      }
    },
    [showToast],
  );

  const createProduct = useCallback(
    async (data: ProductFormData): Promise<boolean> => {
      try {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok || !json.product) throw new Error(json.error);
        setProducts((prev) =>
          [json.product as AdminProduct, ...prev].sort((a, b) => a.name.localeCompare(b.name)),
        );
        showToast(`Added “${json.product.name}”`);
        return true;
      } catch (e) {
        showToast(e instanceof Error && e.message ? e.message : "Couldn't add the product.");
        return false;
      }
    },
    [showToast],
  );

  const updateProduct = useCallback(
    async (id: string, data: ProductFormData): Promise<boolean> => {
      try {
        const res = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...data }),
        });
        const json = await res.json();
        if (!res.ok || !json.product) throw new Error(json.error);
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? (json.product as AdminProduct) : p)),
        );
        showToast(`Updated “${json.product.name}”`);
        return true;
      } catch (e) {
        showToast(e instanceof Error && e.message ? e.message : "Couldn't update the product.");
        return false;
      }
    },
    [showToast],
  );

  const sidebarActive: View = view === "order-detail" ? "orders" : view;
  const ordersBadge = orders.filter((o) => o.needsAction).length;
  const lowStockBadge = products.filter((p) => p.status !== "In stock").length;
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans">
      {/* Floating pill nav */}
      <header className="fixed top-[18px] inset-x-0 z-50 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto w-full max-w-[1320px] flex items-center justify-between gap-4 py-3 pl-7 pr-3 rounded-full border border-white/[0.06] bg-[rgba(15,12,13,0.78)] backdrop-blur-[20px] backdrop-saturate-150 shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,79,163,0.08)_inset] light:border-[rgba(26,13,18,0.08)] light:bg-[rgba(253,247,244,0.82)]">
          <Link
            href="/"
            aria-label="SherryBerries home"
            className="font-display text-[26px] tracking-[0.02em] text-ink no-underline leading-none whitespace-nowrap"
          >
            Sherry<span className="font-serif italic text-pink ml-px">Berries</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
              className="w-10 h-10 grid place-items-center rounded-full border border-white/[0.08] text-ink-dim cursor-pointer transition-colors duration-200 hover:text-ink hover:border-blush [&_svg]:w-[18px] [&_svg]:h-[18px] light:border-[rgba(26,13,18,0.1)]"
            >
              {theme === "dark" ? ICONS.sun : ICONS.moon}
            </button>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-2 py-2 px-4 rounded-full border border-white/12 text-ink-dim no-underline font-sans text-[11px] font-bold tracking-[0.12em] uppercase transition-colors duration-200 hover:text-ink hover:border-blush light:border-[rgba(26,13,18,0.12)]"
            >
              View Store
            </Link>
            <span
              title={admin.email}
              className="w-10 h-10 grid place-items-center rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[12px] font-bold tracking-[0.08em] shadow-[0_6px_16px_rgba(255,79,163,0.4)]"
            >
              SA
            </span>
          </div>
        </div>
      </header>

      {/* Shell */}
      <div className="mx-auto w-full max-w-[1320px] px-4 pt-[104px] pb-20 grid grid-cols-1 min-[940px]:grid-cols-[250px_1fr] gap-7">
        {/* Sidebar */}
        <aside className="min-[940px]:sticky min-[940px]:top-[104px] min-[940px]:self-start">
          <div className="rounded-[20px] border border-white/[0.06] bg-card p-5 light:border-[rgba(26,13,18,0.08)]">
            <div className="mb-5 pb-5 border-b border-white/[0.06] light:border-[rgba(26,13,18,0.06)]">
              <div className="font-sans text-[10px] font-bold tracking-[0.22em] uppercase text-ink-faint">
                Admin
              </div>
              <div className="font-display text-[22px] leading-tight text-ink mt-1">
                Control <span className="text-pink">Room</span>
              </div>
              <div className="font-sans text-[11px] text-ink-faint mt-1.5 truncate">{admin.name}</div>
            </div>

            <nav className="flex min-[940px]:flex-col gap-1.5 overflow-x-auto min-[940px]:overflow-visible">
              {SIDEBAR.map((item) => (
                <SideLink
                  key={item.view}
                  active={sidebarActive === item.view}
                  onClick={() => goto(item.view)}
                  icon={ICONS[item.icon]}
                  label={item.label}
                  badge={
                    item.view === "orders"
                      ? ordersBadge
                      : item.view === "inventory"
                        ? lowStockBadge
                        : undefined
                  }
                />
              ))}
              <Link
                href="/"
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-left whitespace-nowrap no-underline font-sans text-[13px] font-medium text-ink-dim border border-transparent transition-colors duration-200 hover:text-ink hover:bg-white/[0.04] [&_svg]:w-[18px] [&_svg]:h-[18px] light:hover:bg-[rgba(26,13,18,0.04)]"
              >
                <span className="grid place-items-center">{ICONS.store}</span>
                View Store
              </Link>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          {view === "overview" && (
            <OverviewView data={data} orders={orders} onOpenOrder={openOrder} onSeeAll={() => goto("orders")} />
          )}
          {view === "orders" && <OrdersView orders={orders} onOpenOrder={openOrder} />}
          {view === "order-detail" && (
            <OrderDetailView
              order={selectedOrder}
              onBack={() => goto("orders")}
              onUpdateStatus={updateOrderStatus}
            />
          )}
          {view === "inventory" && (
            <InventoryView
              products={products}
              categories={data.categories}
              onSave={saveInventory}
              onConfirmDiscard={(fn) => setConfirmDiscard(() => fn)}
              onCreateProduct={createProduct}
              onUpdateProduct={updateProduct}
            />
          )}
          {view === "analytics" && <AnalyticsView data={data} />}
        </main>
      </div>

      {/* Confirm-discard modal */}
      {confirmDiscard && (
        <div
          onClick={() => setConfirmDiscard(null)}
          className="fixed inset-0 z-[300] grid place-items-center p-6 bg-black/60 backdrop-blur-[6px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[440px] rounded-[22px] border border-line-pink bg-canvas-elev p-7 shadow-[0_30px_80px_rgba(0,0,0,0.6)] light:bg-card"
          >
            <h3 className="font-display text-[20px] text-ink">Discard changes?</h3>
            <p className="mt-2 font-sans text-[13px] text-ink-dim leading-relaxed">
              Your unsaved price and stock edits will be reverted to the last saved values.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDiscard(null)}
                className="py-2.5 px-4 rounded-full border border-white/14 bg-transparent text-ink-dim font-sans text-[11px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-colors hover:text-ink hover:border-blush light:border-[rgba(26,13,18,0.14)]"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDiscard();
                  setConfirmDiscard(null);
                }}
                className="py-2.5 px-4 rounded-full border-0 bg-[rgba(255,141,141,0.16)] text-[#ff8d8d] font-sans text-[11px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-[rgba(255,141,141,0.26)]"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className={
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] py-3.5 px-[22px] rounded-full " +
          "bg-[rgba(15,12,13,0.92)] border border-pink/[0.28] text-white font-sans text-[13px] font-medium tracking-[0.04em] " +
          "backdrop-blur-[20px] shadow-[0_18px_40px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-[240ms] pointer-events-none " +
          (toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5")
        }
      >
        {toast?.msg}
      </div>
    </div>
  );
}

function SideLink({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        "flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer text-left whitespace-nowrap " +
        "font-sans text-[13px] font-medium transition-[color,background-color,border-color] duration-200 " +
        "[&_svg]:w-[18px] [&_svg]:h-[18px] border " +
        (active
          ? "text-blush border-pink/30 bg-[linear-gradient(120deg,rgba(255,79,163,0.16),rgba(255,79,163,0.04))]"
          : "text-ink-dim border-transparent hover:text-ink hover:bg-white/[0.04] light:hover:bg-[rgba(26,13,18,0.04)]")
      }
    >
      <span className="grid place-items-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full bg-pink text-white font-sans text-[10px] font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}
