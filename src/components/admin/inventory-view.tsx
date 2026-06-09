"use client";

import { useMemo, useState } from "react";
import type { AdminProduct, AdminCategory, StockStatus } from "@/lib/queries/admin";
import type { ProductFormData } from "@/lib/admin/options";
import {
  AdminCard,
  StockBadge,
  Stepper,
  ProductThumb,
  btnSolid,
  btnOutline,
  ICONS,
} from "@/components/admin/shared";
import { ProductForm } from "@/components/admin/product-form";

type Draft = Record<string, { price: number; stock: number }>;

function statusFor(stock: number, reorder: number): StockStatus {
  if (stock <= 0) return "Out of stock";
  if (stock <= reorder) return "Low stock";
  return "In stock";
}

export function InventoryView({
  products,
  categories,
  onSave,
  onConfirmDiscard,
  onCreateProduct,
  onUpdateProduct,
}: {
  products: AdminProduct[];
  categories: AdminCategory[];
  onSave: (edits: { id: string; price: number; stock: number }[]) => Promise<boolean>;
  onConfirmDiscard: (fn: () => void) => void;
  onCreateProduct: (data: ProductFormData) => Promise<boolean>;
  onUpdateProduct: (id: string, data: ProductFormData) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<Draft>({});
  const [tab, setTab] = useState<"all" | "reorder">("all");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  // Product add/edit modal: closed = false; adding = null; editing = the product.
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  const eff = (p: AdminProduct) => draft[p.id] ?? { price: p.price, stock: p.stock };
  const isDirty = (p: AdminProduct) => {
    const d = draft[p.id];
    return !!d && (d.price !== p.price || d.stock !== p.stock);
  };

  const dirtyIds = useMemo(
    () => products.filter(isDirty).map((p) => p.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, draft],
  );

  const tiles = useMemo(() => {
    let out = 0,
      low = 0,
      healthy = 0;
    for (const p of products) {
      const { stock } = eff(p);
      const s = statusFor(stock, p.reorder);
      if (s === "Out of stock") out++;
      else if (s === "Low stock") low++;
      else healthy++;
    }
    return { out, low, healthy };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, draft]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const { stock } = eff(p);
      if (tab === "reorder" && statusFor(stock, p.reorder) === "In stock") return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, draft, tab, query]);

  const setField = (p: AdminProduct, patch: Partial<{ price: number; stock: number }>) => {
    setDraft((prev) => {
      const base = prev[p.id] ?? { price: p.price, stock: p.stock };
      return { ...prev, [p.id]: { ...base, ...patch } };
    });
  };

  const handleSave = async () => {
    const edits = products.filter(isDirty).map((p) => ({ id: p.id, ...eff(p) }));
    if (edits.length === 0) return;
    setSaving(true);
    const ok = await onSave(edits);
    setSaving(false);
    if (ok) setDraft({});
  };

  const handleDiscard = () => onConfirmDiscard(() => setDraft({}));

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setFormOpen(true);
  };
  const handleFormSubmit = async (data: ProductFormData) => {
    setFormBusy(true);
    const ok = editing ? await onUpdateProduct(editing.id, data) : await onCreateProduct(data);
    setFormBusy(false);
    if (ok) setFormOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[30px] leading-none text-ink">Inventory</h1>
          <p className="mt-2 font-sans text-[13px] text-ink-dim">
            {products.length} products. Edit price and stock inline, or open a product to edit its details.
          </p>
        </div>
        <button type="button" onClick={openAdd} className={btnSolid}>
          <span className="[&_svg]:w-4 [&_svg]:h-4">{ICONS.plus}</span>
          Add product
        </button>
      </header>

      {/* Alert tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AlertTile tone="red" icon={ICONS.alertOut} count={tiles.out} label="Out of stock" />
        <AlertTile tone="gold" icon={ICONS.alertLow} count={tiles.low} label="Low / reorder soon" />
        <AlertTile tone="green" icon={ICONS.healthy} count={tiles.healthy} label="Healthy stock" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex gap-2">
          {(["all", "reorder"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "py-2 px-3.5 rounded-full whitespace-nowrap cursor-pointer font-sans text-[12px] font-bold tracking-[0.08em] uppercase border transition-colors duration-200 " +
                (tab === t
                  ? "bg-ink text-canvas border-ink"
                  : "bg-transparent text-ink-dim border-white/12 hover:text-ink hover:border-blush light:border-[rgba(26,13,18,0.12)]")
              }
            >
              {t === "all" ? "All products" : "Needs reorder"}
            </button>
          ))}
        </div>
        <div className="relative max-w-[360px] flex-1 min-w-[200px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint [&_svg]:w-[18px] [&_svg]:h-[18px]">
            {ICONS.search}
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, SKU, or category"
            className="w-full h-11 pl-11 pr-3.5 rounded-full border border-white/12 bg-white/[0.03] font-sans text-[13px] text-ink placeholder:text-ink-faint outline-none focus:border-pink light:bg-white light:border-[rgba(26,13,18,0.12)]"
          />
        </div>
      </div>

      <AdminCard bodyClassName="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr_0.9fr_64px] gap-4 px-5 py-3 border-b border-white/[0.06] font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-ink-faint light:border-[rgba(26,13,18,0.06)]">
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span className="text-right">Status</span>
              <span className="sr-only">Edit</span>
            </div>
            <ul>
              {filtered.map((p) => {
                const v = eff(p);
                const dirty = isDirty(p);
                const status = statusFor(v.stock, p.reorder);
                return (
                  <li
                    key={p.id}
                    className={
                      "grid grid-cols-[2fr_1fr_1fr_1.2fr_0.9fr_64px] gap-4 items-center px-5 py-3.5 border-b border-white/[0.04] last:border-0 transition-colors light:border-[rgba(26,13,18,0.04)] " +
                      (dirty ? "bg-pink/[0.06] light:bg-pink/[0.05]" : "")
                    }
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="relative w-11 h-11 rounded-lg overflow-hidden bg-canvas-2 border border-white/10 shrink-0 light:border-[rgba(26,13,18,0.1)]">
                        <ProductThumb src={p.img} alt={p.name} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-sans text-[13px] font-medium text-ink truncate">
                          {p.name}
                        </span>
                        <span className="block font-sans text-[11px] text-ink-faint truncate">
                          {p.sku} · sold 30d: {p.sold30}
                        </span>
                      </span>
                    </span>
                    <span className="font-sans text-[12px] text-ink-dim truncate">{p.category}</span>
                    <span className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint font-sans text-[13px]">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={v.price}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          setField(p, { price: Number.isFinite(n) ? Math.max(0, n) : 0 });
                        }}
                        className="w-24 h-9 pl-6 pr-2 rounded-lg border border-white/12 bg-white/[0.03] font-sans text-[13px] text-ink outline-none focus:border-pink light:bg-white light:border-[rgba(26,13,18,0.12)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </span>
                    <span>
                      <Stepper value={v.stock} onChange={(stock) => setField(p, { stock })} />
                      <span className="block mt-1 font-sans text-[10px] text-ink-faint">
                        reorder ≤ {p.reorder}
                      </span>
                    </span>
                    <span className="flex justify-end">
                      <StockBadge status={status} />
                    </span>
                    <span className="flex justify-end">
                      <button
                        type="button"
                        aria-label={`Edit ${p.name}`}
                        onClick={() => openEdit(p)}
                        className="w-9 h-9 grid place-items-center rounded-lg border border-white/12 text-ink-dim cursor-pointer transition-colors duration-150 hover:text-ink hover:border-blush hover:bg-pink/[0.06] [&_svg]:w-4 [&_svg]:h-4 light:border-[rgba(26,13,18,0.12)]"
                      >
                        {ICONS.edit}
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
            {filtered.length === 0 && (
              <p className="p-8 text-center font-sans text-[13px] text-ink-faint">No products match.</p>
            )}
          </div>
        </div>
      </AdminCard>

      {/* Sticky save / discard bar */}
      {dirtyIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] w-[calc(100%-2rem)] max-w-[560px]">
          <div className="flex items-center justify-between gap-4 py-3 pl-5 pr-3 rounded-full border border-pink/30 bg-[rgba(15,12,13,0.94)] backdrop-blur-[20px] shadow-[0_18px_44px_rgba(0,0,0,0.55)] light:bg-[rgba(253,247,244,0.96)] light:border-[rgba(26,13,18,0.12)]">
            <span className="font-sans text-[13px] text-ink">
              <span className="font-bold text-blush">{dirtyIds.length}</span> unsaved{" "}
              {dirtyIds.length === 1 ? "change" : "changes"}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleDiscard} disabled={saving} className={btnOutline}>
                Discard
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className={btnSolid}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / edit product modal */}
      {formOpen && (
        <ProductForm
          product={editing}
          categories={categories}
          busy={formBusy}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

function AlertTile({
  tone,
  icon,
  count,
  label,
}: {
  tone: "red" | "gold" | "green";
  icon: React.ReactNode;
  count: number;
  label: string;
}) {
  const toneClass = {
    red: "text-[#ff8d8d] bg-[rgba(255,141,141,0.1)] border-[rgba(255,141,141,0.22)]",
    gold: "text-gold-soft bg-[rgba(232,200,121,0.1)] border-[rgba(232,200,121,0.22)]",
    green: "text-[#5fd29a] bg-[rgba(95,210,154,0.1)] border-[rgba(95,210,154,0.22)]",
  }[tone];
  return (
    <div className={`rounded-[18px] border p-5 flex items-center gap-4 ${toneClass}`}>
      <span className="w-11 h-11 grid place-items-center rounded-full bg-white/[0.06] [&_svg]:w-[22px] [&_svg]:h-[22px]">
        {icon}
      </span>
      <div>
        <div className="font-display text-[26px] leading-none">{count}</div>
        <div className="font-sans text-[11px] tracking-[0.04em] mt-1 opacity-80">{label}</div>
      </div>
    </div>
  );
}
