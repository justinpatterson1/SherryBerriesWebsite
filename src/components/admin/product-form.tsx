"use client";

import { useState } from "react";
import type { AdminProduct, AdminCategory } from "@/lib/queries/admin";
import { JEWELRY_TYPES, type ProductFormData } from "@/lib/admin/options";
import { ProductThumb, btnSolid, btnOutline, ICONS } from "@/components/admin/shared";

const fieldClass =
  "w-full h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink " +
  "placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";
const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5";
const numClass =
  fieldClass + " [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

type FormState = {
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  reorder: string;
  categoryId: string;
  jewelryType: string;
  material: string;
  imageUrl: string;
  featured: boolean;
  active: boolean;
};

function initialState(p: AdminProduct | null): FormState {
  return {
    name: p?.name ?? "",
    sku: p?.sku ?? "",
    shortDescription: p?.shortDescription ?? "",
    description: p?.description ?? "",
    price: p ? String(p.price) : "",
    compareAtPrice: p?.compareAtPrice != null ? String(p.compareAtPrice) : "",
    stock: p ? String(p.stock) : "0",
    reorder: p ? String(p.reorder) : "5",
    categoryId: p?.categoryId ?? "",
    jewelryType: p?.jewelryType ?? "",
    material: p?.material ?? "",
    imageUrl: p?.img ?? "",
    featured: p?.featured ?? false,
    active: p?.active ?? true,
  };
}

export function ProductForm({
  product,
  categories,
  busy,
  onCancel,
  onSubmit,
}: {
  product: AdminProduct | null;
  categories: AdminCategory[];
  busy: boolean;
  onCancel: () => void;
  onSubmit: (data: ProductFormData) => void;
}) {
  const [f, setF] = useState<FormState>(() => initialState(product));
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const price = parseFloat(f.price);
    const compare = f.compareAtPrice.trim() === "" ? null : parseFloat(f.compareAtPrice);
    const stock = parseInt(f.stock, 10);
    const reorder = parseInt(f.reorder, 10);

    if (!f.name.trim()) return setError("Name is required.");
    if (!f.sku.trim()) return setError("SKU is required.");
    if (!f.shortDescription.trim()) return setError("A short description is required.");
    if (!f.description.trim()) return setError("A description is required.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    if (compare !== null && (!Number.isFinite(compare) || compare < 0))
      return setError("Compare-at price must be a valid number.");
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number ≥ 0.");
    if (!Number.isInteger(reorder) || reorder < 0)
      return setError("Reorder threshold must be a whole number ≥ 0.");
    if (!f.categoryId) return setError("Please choose a category.");
    if (!f.jewelryType) return setError("Please choose a jewelry type.");

    setError(null);
    onSubmit({
      name: f.name.trim(),
      sku: f.sku.trim(),
      shortDescription: f.shortDescription.trim(),
      description: f.description.trim(),
      price,
      compareAtPrice: compare,
      stock,
      reorder,
      categoryId: f.categoryId,
      jewelryType: f.jewelryType,
      material: f.material.trim(),
      featured: f.featured,
      active: f.active,
      imageUrl: f.imageUrl.trim(),
    });
  };

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[300] grid place-items-center p-4 bg-black/60 backdrop-blur-[6px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[680px] max-h-[90vh] overflow-y-auto rounded-[22px] border border-line-pink bg-canvas-elev shadow-[0_30px_80px_rgba(0,0,0,0.6)] light:bg-card"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-7 py-5 border-b border-white/[0.06] bg-canvas-elev light:bg-card light:border-[rgba(26,13,18,0.06)]">
          <h3 className="font-display text-[22px] text-ink">
            {product ? "Edit product" : "Add product"}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="w-9 h-9 grid place-items-center rounded-full border border-white/12 text-ink-dim cursor-pointer transition-colors hover:text-ink hover:border-blush [&_svg]:w-4 [&_svg]:h-4 light:border-[rgba(26,13,18,0.12)]"
          >
            {ICONS.close}
          </button>
        </div>

        <div className="p-7 flex flex-col gap-5">
          {error && (
            <p className="rounded-xl border border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.1)] px-4 py-2.5 font-sans text-[12px] text-[#ff8d8d]">
              {error}
            </p>
          )}

          <div>
            <label className={labelClass}>Product name</label>
            <input className={fieldClass} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Rose Gold Belly Ring" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>SKU</label>
              <input className={fieldClass} value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder="SB-ROSEGOLD14" />
            </div>
            <div>
              <label className={labelClass}>Material</label>
              <input className={fieldClass} value={f.material} onChange={(e) => set("material", e.target.value)} placeholder="14k gold / titanium" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Short description</label>
            <input className={fieldClass} value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="One-line summary shown on cards" />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="Full product description"
              className="w-full px-3.5 py-3 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink resize-y light:bg-white light:border-[rgba(26,13,18,0.12)]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Price</label>
              <input type="number" min={0} step="0.01" className={numClass} value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Compare-at</label>
              <input type="number" min={0} step="0.01" className={numClass} value={f.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} placeholder="—" />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input type="number" min={0} step="1" className={numClass} value={f.stock} onChange={(e) => set("stock", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Reorder ≤</label>
              <input type="number" min={0} step="1" className={numClass} value={f.reorder} onChange={(e) => set("reorder", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select className={fieldClass} value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="" disabled>
                  Choose a category…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Jewelry type</label>
              <select className={fieldClass} value={f.jewelryType} onChange={(e) => set("jewelryType", e.target.value)}>
                <option value="" disabled>
                  Choose a type…
                </option>
                {JEWELRY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Image URL</label>
            <div className="flex items-center gap-3">
              <span className="relative w-14 h-14 rounded-xl overflow-hidden bg-canvas-2 border border-white/10 shrink-0 light:border-[rgba(26,13,18,0.1)]">
                <ProductThumb src={f.imageUrl.trim() || null} alt="" />
              </span>
              <input className={fieldClass} value={f.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 pt-1">
            <Toggle label="Featured" checked={f.featured} onChange={(v) => set("featured", v)} />
            <Toggle label="Active (visible in store)" checked={f.active} onChange={(v) => set("active", v)} />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 px-7 py-5 border-t border-white/[0.06] bg-canvas-elev light:bg-card light:border-[rgba(26,13,18,0.06)]">
          <button type="button" onClick={onCancel} disabled={busy} className={btnOutline}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={busy} className={btnSolid}>
            {busy ? "Saving…" : product ? "Save product" : "Create product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 cursor-pointer"
    >
      <span
        className={
          "relative w-10 h-6 rounded-full transition-colors duration-200 " +
          (checked ? "bg-pink" : "bg-white/12 light:bg-[rgba(26,13,18,0.14)]")
        }
      >
        <span
          className={
            "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 " +
            (checked ? "translate-x-[18px]" : "translate-x-0.5")
          }
        />
      </span>
      <span className="font-sans text-[13px] text-ink-dim">{label}</span>
    </button>
  );
}
