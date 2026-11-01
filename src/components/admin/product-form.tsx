"use client";

import { useRef, useState } from "react";
import type { AdminProduct, AdminCategory } from "@/lib/queries/admin";
import { type ProductFormData } from "@/lib/admin/options";
import { DEFAULT_SIZE_LABEL, SIZES_MAX } from "@/lib/admin/sizes";
import { COLORS_MAX } from "@/lib/admin/colors";
import { validateVariants, variantLabel } from "@/lib/admin/variants";
import { ProductThumb, btnSolid, btnOutline, ICONS } from "@/components/admin/shared";

const fieldClass =
  "w-full h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink " +
  "placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";
const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5";
const numClass =
  fieldClass + " [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

/**
 * A size row while it is being edited — numbers stay strings until submit.
 * `key` identifies the row in the stock grid, so a rename keeps its quantities.
 */
type SizeField = { key: string; previous: string | null; value: string; additionalPrice: string };

/** A colour row while it is being edited. */
type ColorField = {
  key: string;
  id: string | null;
  name: string;
  swatch: string;
  imageUrl: string;
  additionalPrice: string;
};

let lastKey = 0;
const newKey = () => `new-${++lastKey}`;

/** Where a stock line's quantity sits in `FormState.stock`. "" for a missing axis. */
const cellKey = (colorKey: string, sizeKey: string) => `${colorKey}|${sizeKey}`;

const money2 = (n: number) => Number(n.toFixed(2));

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
  material: string;
  careInstructions: string;
  imageUrl: string;
  featured: boolean;
  active: boolean;
  sizeLabel: string;
  sizes: SizeField[];
  colors: ColorField[];
  /** Quantity per stock line, by cellKey(). */
  lineStock: Record<string, string>;
  isDigital: boolean;
  digitalFileKey: string;
  digitalFileName: string;
  isPreorder: boolean;
};

function initialState(p: AdminProduct | null): FormState {
  const colors: ColorField[] = (p?.colors ?? []).map((c) => ({
    key: c.id,
    id: c.id,
    name: c.name,
    swatch: c.swatch ?? "",
    imageUrl: c.imageUrl,
    additionalPrice: c.additionalPrice != null ? String(c.additionalPrice) : "",
  }));
  const colorExtra = new Map((p?.colors ?? []).map((c) => [c.id, c.additionalPrice ?? 0]));

  // Sizes are not stored on their own: each is read off the first stock line
  // that has it. A line's extra price is the size's plus the colour's, so the
  // colour's is taken back off to recover what the admin typed for the size.
  const sizes: SizeField[] = [];
  for (const v of p?.sizes ?? []) {
    if (v.size === null || sizes.some((s) => s.value === v.size)) continue;
    const extra = v.additionalPrice === null ? 0 : v.additionalPrice - (colorExtra.get(v.colorId ?? "") ?? 0);
    sizes.push({
      key: `size-${v.size}`,
      previous: v.size,
      value: v.size,
      additionalPrice: extra > 0 ? String(money2(extra)) : "",
    });
  }

  const lineStock: Record<string, string> = {};
  for (const v of p?.sizes ?? []) {
    lineStock[cellKey(v.colorId ?? "", v.size === null ? "" : `size-${v.size}`)] = String(v.quantity);
  }

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
    material: p?.material ?? "",
    careInstructions: p?.careInstructions ?? "",
    imageUrl: p?.img ?? "",
    featured: p?.featured ?? false,
    active: p?.active ?? true,
    isDigital: p?.isDigital ?? false,
    digitalFileKey: p?.digitalFileKey ?? "",
    digitalFileName: p?.digitalFileName ?? "",
    isPreorder: p?.isPreorder ?? false,
    sizeLabel: p?.sizeLabel ?? "",
    sizes,
    colors,
    lineStock,
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingDigital, setUploadingDigital] = useState(false);
  const [digitalError, setDigitalError] = useState<string | null>(null);
  const digitalRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  // --- Sizes, colours and stock -----------------------------------------

  const filledSizes = f.sizes.filter((r) => r.value.trim() !== "");
  const filledColors = f.colors.filter((c) => c.name.trim() !== "");
  const hasSizes = filledSizes.length > 0;
  const hasColors = filledColors.length > 0;
  const hasLines = hasSizes || hasColors;

  // A product gaining an axis keeps its stock under that axis's first value,
  // as matchVariants() does on save — so a sized piece that gains colours shows
  // its sizes' quantities under the first colour rather than zeros that would
  // wipe them.
  // The colour whose photo becomes the cover when no main image is chosen.
  const coverFallback = !f.isDigital && filledColors[0]?.imageUrl.trim() ? filledColors[0] : null;

  const qtyOf = (colorKey: string, sizeKey: string) =>
    f.lineStock[cellKey(colorKey, sizeKey)] ??
    (colorKey !== "" && colorKey === filledColors[0]?.key ? f.lineStock[cellKey("", sizeKey)] : undefined) ??
    (sizeKey !== "" && sizeKey === filledSizes[0]?.key ? f.lineStock[cellKey(colorKey, "")] : undefined) ??
    "0";
  const setQty = (colorKey: string, sizeKey: string, value: string) =>
    setF((prev) => ({ ...prev, lineStock: { ...prev.lineStock, [cellKey(colorKey, sizeKey)]: value } }));

  // Every stock line the product will have, mirroring validateVariants().
  const lines = (hasColors ? filledColors : [null]).flatMap((c) =>
    (hasSizes ? filledSizes : [null]).map((r) => ({ colorKey: c?.key ?? "", sizeKey: r?.key ?? "", color: c, size: r })),
  );
  // Mirrors stockFromVariants() on the server, so the number shown here is the
  // number that will be saved. A line mid-edit counts as 0 rather than NaN.
  const lineTotal = hasLines
    ? lines.reduce((sum, l) => {
        const q = parseInt(qtyOf(l.colorKey, l.sizeKey), 10);
        return sum + (Number.isFinite(q) && q > 0 ? q : 0);
      }, 0)
    : 0;

  const addSize = () =>
    setF((prev) =>
      prev.sizes.length >= SIZES_MAX
        ? prev
        : {
            ...prev,
            // Naming the axis on the first row saves the admin a step; they
            // can still change it.
            sizeLabel: prev.sizeLabel || DEFAULT_SIZE_LABEL,
            sizes: [...prev.sizes, { key: newKey(), previous: null, value: "", additionalPrice: "" }],
          },
    );

  const removeSize = (i: number) =>
    setF((prev) => ({ ...prev, sizes: prev.sizes.filter((_, n) => n !== i) }));

  const setSize = (i: number, key: "value" | "additionalPrice", value: string) =>
    setF((prev) => ({
      ...prev,
      sizes: prev.sizes.map((r, n) => (n === i ? { ...r, [key]: value } : r)),
    }));

  const addColor = () =>
    setF((prev) =>
      prev.colors.length >= COLORS_MAX
        ? prev
        : {
            ...prev,
            colors: [
              ...prev.colors,
              { key: newKey(), id: null, name: "", swatch: "", imageUrl: "", additionalPrice: "" },
            ],
          },
    );

  const removeColor = (i: number) =>
    setF((prev) => ({ ...prev, colors: prev.colors.filter((_, n) => n !== i) }));

  const setColor = (i: number, key: "name" | "swatch" | "imageUrl" | "additionalPrice", value: string) =>
    setF((prev) => ({
      ...prev,
      colors: prev.colors.map((c, n) => (n === i ? { ...c, [key]: value } : c)),
    }));

  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [colorUploadError, setColorUploadError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok || !json.url) throw new Error(json.error || "Upload failed.");
    return json.url as string;
  };

  const handleColorFile = async (i: number, colorKey: string, input: HTMLInputElement) => {
    const file = input.files?.[0];
    if (!file) return;
    setColorUploadError(null);
    setUploadingColor(colorKey);
    try {
      setColor(i, "imageUrl", await uploadImage(file));
    } catch (e) {
      setColorUploadError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploadingColor(null);
      input.value = "";
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      set("imageUrl", await uploadImage(file));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset so selecting the same file again re-triggers onChange.
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDigitalFile = async (file: File | undefined) => {
    if (!file) return;
    setDigitalError(null);
    setUploadingDigital(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/digital", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.key) throw new Error(json.error || "Upload failed.");
      setF((prev) => ({
        ...prev,
        digitalFileKey: json.key as string,
        digitalFileName: (json.fileName as string) || prev.digitalFileName,
      }));
    } catch (e) {
      setDigitalError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploadingDigital(false);
      if (digitalRef.current) digitalRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    const price = parseFloat(f.price);
    const compare = f.compareAtPrice.trim() === "" ? null : parseFloat(f.compareAtPrice);
    // A download has no stock and no reorder point; the server pins both to 0.
    // A preorder has no stock yet, and the server pins that to 0 too.
    const stock = f.isDigital || f.isPreorder ? 0 : parseInt(f.stock, 10);
    const reorder = f.isDigital ? 0 : parseInt(f.reorder, 10);

    if (!f.name.trim()) return setError("Name is required.");
    if (!f.sku.trim()) return setError("SKU is required.");
    if (!f.shortDescription.trim()) return setError("A short description is required.");
    if (!f.description.trim()) return setError("A description is required.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    if (compare !== null && (!Number.isFinite(compare) || compare < 0))
      return setError("Compare-at price must be a valid number.");
    if (f.isDigital && !f.digitalFileKey.trim())
      return setError("Upload the PDF before saving a digital product.");
    if (f.isDigital && hasLines) return setError("A digital product can't have sizes or colours.");
    if (f.isDigital && f.isPreorder) return setError("A digital product can't be a preorder.");
    if (!f.isDigital && !f.isPreorder && !hasLines && (!Number.isInteger(stock) || stock < 0))
      return setError("Stock must be a whole number ≥ 0.");

    const priceOf = (v: string) => (v.trim() === "" ? null : parseFloat(v));
    const sizes = filledSizes.map((r) => ({
      previous: r.previous,
      value: r.value.trim(),
      additionalPrice: priceOf(r.additionalPrice),
    }));
    const colors = filledColors.map((c) => ({
      id: c.id,
      name: c.name.trim(),
      swatch: c.swatch.trim(),
      imageUrl: c.imageUrl.trim(),
      additionalPrice: priceOf(c.additionalPrice),
    }));
    // A preorder has no stock; the server pins every line to 0 anyway.
    const variantStock = f.isDigital
      ? []
      : lines.map((l) => ({
          color: l.color?.name.trim() ?? null,
          size: l.size?.value.trim() ?? null,
          quantity: f.isPreorder ? 0 : Number(qtyOf(l.colorKey, l.sizeKey).trim() || NaN),
        }));
    // The same checks the server runs, so the admin hears about a duplicate
    // or a missing colour photo before the round trip.
    const checked = validateVariants({ sizeLabel: f.sizeLabel, sizes, colors, stock: variantStock });
    if (!checked.ok) return setError(checked.error);
    if (!f.isDigital && (!Number.isInteger(reorder) || reorder < 0))
      return setError("Reorder threshold must be a whole number ≥ 0.");
    if (!f.categoryId) return setError("Please choose a category.");

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
      material: f.material.trim(),
      careInstructions: f.careInstructions.trim(),
      featured: f.featured,
      active: f.active,
      imageUrl: f.imageUrl.trim(),
      isDigital: f.isDigital,
      digitalFileKey: f.isDigital ? f.digitalFileKey.trim() : "",
      digitalFileName: f.isDigital ? f.digitalFileName.trim() : "",
      isPreorder: f.isPreorder,
      sizeLabel: hasSizes ? f.sizeLabel.trim() || DEFAULT_SIZE_LABEL : "",
      sizes: f.isDigital ? [] : sizes,
      colors: f.isDigital ? [] : colors,
      variantStock,
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

          <div>
            <label className={labelClass} htmlFor="prod-care">Care &amp; cleaning</label>
            <textarea
              id="prod-care"
              value={f.careInstructions}
              onChange={(e) => set("careInstructions", e.target.value)}
              rows={3}
              placeholder="How to clean and look after this piece"
              className="w-full px-3.5 py-3 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink resize-y light:bg-white light:border-[rgba(26,13,18,0.12)]"
            />
            {/* Optional, and says so: the PDP already has house care copy, and
                a blank box here should not read as a missing field. */}
            <p className="mt-1.5 font-sans text-[11px] leading-[1.5] text-ink-faint">
              {f.careInstructions.trim()
                ? "Shown in the Care & cleaning section on this product’s page."
                : "Optional. Leave blank to use the standard care advice."}
            </p>
          </div>

          <div
            className={
              "grid gap-4 " +
              (f.isDigital ? "grid-cols-2" : f.isPreorder ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")
            }
          >
            <div>
              <label className={labelClass}>Price</label>
              <input type="number" min={0} step="0.01" className={numClass} value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Compare-at</label>
              <input type="number" min={0} step="0.01" className={numClass} value={f.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} placeholder="0.00" />
            </div>
            {/* A download cannot run out, so it has no stock or reorder point. */}
            {/* A preorder has no stock until it comes off preorder. */}
            {!f.isDigital && (
              <>
                {!f.isPreorder && (
                <div>
                  <label className={labelClass}>Stock</label>
                  {/* Derived once sizes or colours exist — editing it would just be overwritten
                      by their sum on save, so it is shown rather than offered. */}
                  <input
                    type="number"
                    min={0}
                    step="1"
                    className={numClass + (hasLines ? " opacity-60 cursor-not-allowed" : "")}
                    value={hasLines ? String(lineTotal) : f.stock}
                    readOnly={hasLines}
                    title={hasLines ? "Total of the stock lines below" : undefined}
                    onChange={(e) => set("stock", e.target.value)}
                  />
                </div>
                )}
                <div>
                  <label className={labelClass}>Reorder ≤</label>
                  <input type="number" min={0} step="1" className={numClass} value={f.reorder} onChange={(e) => set("reorder", e.target.value)} />
                </div>
              </>
            )}
          </div>

          {/* --- Digital product ------------------------------------------- */}
          <div className="rounded-xl border border-white/12 bg-white/[0.02] p-4 light:bg-white light:border-[rgba(26,13,18,0.12)]">
            <div className="flex items-start gap-2.5">
              <input
                id="prod-digital"
                type="checkbox"
                className="mt-0.5 accent-pink cursor-pointer"
                checked={f.isDigital}
                // The Preorder toggle hides for a download, so clear it here
                // rather than leave a flag set that nothing on screen can unset.
                onChange={(e) => {
                  const isDigital = e.target.checked;
                  setF((prev) => ({ ...prev, isDigital, isPreorder: isDigital ? false : prev.isPreorder }));
                }}
              />
              <label htmlFor="prod-digital" className="cursor-pointer">
                <span className="font-sans text-[14px] text-ink">Digital product (PDF download)</span>
                <span className="block mt-0.5 font-sans text-[11px] leading-[1.5] text-ink-faint">
                  Delivered from the buyer’s order page instead of shipped. No stock, no sizes,
                  and no delivery address at checkout.
                </span>
              </label>
            </div>

            {f.isDigital && (
              <div className="mt-3.5 pt-3.5 border-t border-white/[0.08] light:border-[rgba(26,13,18,0.08)]">
                <span className={labelClass + " block"}>PDF file</span>
                {f.digitalFileKey ? (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full border border-[rgba(95,210,154,0.3)] bg-[rgba(95,210,154,0.12)] font-sans text-[11px] font-semibold text-[#5fd29a]">
                      ✓ {f.digitalFileName || "PDF uploaded"}
                    </span>
                    <button
                      type="button"
                      onClick={() => digitalRef.current?.click()}
                      disabled={uploadingDigital}
                      className="font-sans text-[11px] font-medium tracking-[0.1em] uppercase text-ink-faint hover:text-blush transition-colors bg-transparent border-0 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingDigital ? "Uploading…" : "Replace"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => digitalRef.current?.click()}
                    disabled={uploadingDigital}
                    className="py-2.5 px-4 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[13px] text-ink cursor-pointer hover:border-pink transition-colors disabled:opacity-50 light:bg-white light:border-[rgba(26,13,18,0.12)]"
                  >
                    {uploadingDigital ? "Uploading…" : "Choose a PDF…"}
                  </button>
                )}
                <input
                  ref={digitalRef}
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(e) => handleDigitalFile(e.target.files?.[0])}
                />
                <p className="mt-1.5 font-sans text-[11px] leading-[1.5] text-ink-faint">
                  PDF only, up to 5 MB. Stored privately, so buyers reach it through their order
                  page, never a public link.
                </p>
                {digitalError && (
                  <p className="mt-1.5 font-sans text-[11px] text-[#ff8d8d]">{digitalError}</p>
                )}
              </div>
            )}
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
              {/* The category decides whether the product is browsable, now
                  that it is the only taxonomy. Say so rather than letting the
                  choice hide stock silently. */}
              <p className="mt-1.5 font-sans text-[11px] leading-[1.5] text-ink-faint">
                {categories.find((c) => c.id === f.categoryId)?.isJewelry === false
                  ? "Hidden from the main Jewelry page, reachable only from its own category."
                  : "Shown on the Jewelry page as well as its category."}
              </p>
            </div>
          </div>

          {/* --- Colours, sizes and stock --- (a download has none) */}
          {!f.isDigital && (
          <div className="rounded-xl border border-white/10 p-4 flex flex-col gap-3.5 light:border-[rgba(26,13,18,0.1)]">
            <div>
              <span className={labelClass + " mb-0"}>Colours, sizes &amp; stock</span>
              <p className="font-sans text-[11px] leading-[1.5] text-ink-faint mt-1">
                {f.isPreorder
                  ? "On preorder, customers pick a colour and size but there is no stock. Enter quantities when it comes off preorder."
                  : hasLines
                  ? `Stock is the total of the lines below: ${lineTotal} in all.`
                  : "Leave both empty for a product sold in one colour and size only."}
              </p>
            </div>

            {/* Colours */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={labelClass + " mb-0"}>Colours</span>
                <button type="button" onClick={addColor} disabled={f.colors.length >= COLORS_MAX} className={btnOutline}>
                  <span className="inline-flex items-center gap-2 [&_svg]:w-4 [&_svg]:h-4">
                    {ICONS.plus} Add colour
                  </span>
                </button>
              </div>

              {f.colors.map((c, i) => {
                const swatchOk = /^#[0-9a-f]{6}$/i.test(c.swatch.trim());
                return (
                  <div
                    key={c.key}
                    className="flex flex-col gap-2.5 rounded-xl border border-white/[0.08] p-3 light:border-[rgba(26,13,18,0.08)]"
                  >
                    <div
                      className={
                        "grid gap-2.5 items-end " +
                        (hasSizes
                          ? "grid-cols-[1fr_104px_36px]"
                          : "grid-cols-[1fr_92px_104px_36px] max-[600px]:grid-cols-[1fr_72px_36px]")
                      }
                    >
                      <div>
                        {i === 0 && <span className={labelClass}>Colour</span>}
                        <input
                          className={fieldClass}
                          value={c.name}
                          onChange={(e) => setColor(i, "name", e.target.value)}
                          placeholder="Gold"
                          aria-label={`Colour ${i + 1}`}
                        />
                      </div>
                      {!hasSizes && (
                        <div>
                          {i === 0 && <span className={labelClass}>Qty</span>}
                          <input
                            type="number"
                            min={0}
                            step="1"
                            className={numClass + (f.isPreorder ? " opacity-60 cursor-not-allowed" : "")}
                            value={f.isPreorder ? "" : qtyOf(c.key, "")}
                            disabled={f.isPreorder}
                            placeholder={f.isPreorder ? "—" : undefined}
                            onChange={(e) => setQty(c.key, "", e.target.value)}
                            aria-label={`Quantity for colour ${i + 1}`}
                          />
                        </div>
                      )}
                      <div className={hasSizes ? "" : "max-[600px]:hidden"}>
                        {i === 0 && <span className={labelClass}>+ Price</span>}
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className={numClass}
                          value={c.additionalPrice}
                          onChange={(e) => setColor(i, "additionalPrice", e.target.value)}
                          placeholder="0.00"
                          aria-label={`Extra price for colour ${i + 1}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeColor(i)}
                        aria-label={`Remove colour ${i + 1}`}
                        className="w-9 h-11 grid place-items-center rounded-xl border border-white/12 text-ink-faint cursor-pointer transition-colors hover:text-[#ff8d8d] hover:border-[rgba(255,141,141,0.4)] [&_svg]:w-4 [&_svg]:h-4 light:border-[rgba(26,13,18,0.12)]"
                      >
                        {ICONS.close}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="relative w-11 h-11 rounded-lg overflow-hidden bg-canvas-2 border border-white/10 shrink-0 light:border-[rgba(26,13,18,0.1)]">
                        <ProductThumb src={c.imageUrl.trim() || null} alt="" />
                      </span>
                      <label
                        className={
                          btnOutline +
                          (uploadingColor === c.key ? " opacity-60 pointer-events-none" : "")
                        }
                      >
                        {uploadingColor === c.key ? "Uploading…" : c.imageUrl ? "Replace photo" : "Upload photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => handleColorFile(i, c.key, e.currentTarget)}
                        />
                      </label>
                      {!c.imageUrl.trim() && uploadingColor !== c.key && (
                        <span className="font-sans text-[11px] font-semibold text-[#ff8d8d]">Photo required</span>
                      )}
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="w-5 h-5 rounded-full border border-white/20 shrink-0 light:border-[rgba(26,13,18,0.2)]"
                          style={{ background: swatchOk ? c.swatch.trim() : "transparent" }}
                        />
                        <input
                          className={fieldClass + " w-[112px]"}
                          value={c.swatch}
                          onChange={(e) => setColor(i, "swatch", e.target.value)}
                          placeholder="#c9a96e"
                          aria-label={`Swatch colour for colour ${i + 1}`}
                        />
                      </span>
                    </div>
                  </div>
                );
              })}
              {f.colors.length > 0 && (
                <p className="font-sans text-[11px] leading-[1.5] text-ink-faint m-0">
                  Each colour needs a photo: picking it on the product page shows that photo. The
                  swatch is optional; without one, the photo is used.
                </p>
              )}
              {colorUploadError && (
                <p className="font-sans text-[12px] text-[#ff8d8d] m-0">{colorUploadError}</p>
              )}
            </div>

            {/* Sizes */}
            <div className="flex flex-col gap-2.5 pt-3.5 border-t border-white/[0.08] light:border-[rgba(26,13,18,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={labelClass + " mb-0"}>Sizes</span>
                <button type="button" onClick={addSize} disabled={f.sizes.length >= SIZES_MAX} className={btnOutline}>
                  <span className="inline-flex items-center gap-2 [&_svg]:w-4 [&_svg]:h-4">
                    {ICONS.plus} Add size
                  </span>
                </button>
              </div>

              {f.sizes.length > 0 && (
                <>
                  <div className="max-w-[220px]">
                    <label className={labelClass} htmlFor="size-label">
                      What the sizes measure
                    </label>
                    <input
                      id="size-label"
                      className={fieldClass}
                      value={f.sizeLabel}
                      onChange={(e) => set("sizeLabel", e.target.value)}
                      placeholder={DEFAULT_SIZE_LABEL}
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {f.sizes.map((r, i) => (
                      <div
                        key={r.key}
                        className={
                          "grid gap-2.5 items-end " +
                          (hasColors
                            ? "grid-cols-[1fr_104px_36px]"
                            : "grid-cols-[1fr_92px_104px_36px] max-[600px]:grid-cols-[1fr_72px_36px]")
                        }
                      >
                        <div>
                          {i === 0 && <span className={labelClass}>{f.sizeLabel || DEFAULT_SIZE_LABEL}</span>}
                          <input
                            className={fieldClass}
                            value={r.value}
                            onChange={(e) => setSize(i, "value", e.target.value)}
                            placeholder="8mm"
                            aria-label={`Size ${i + 1}`}
                          />
                        </div>
                        {/* With colours too, quantities move to the grid below. */}
                        {!hasColors && (
                          <div>
                            {i === 0 && <span className={labelClass}>Qty</span>}
                            <input
                              type="number"
                              min={0}
                              step="1"
                              className={numClass + (f.isPreorder ? " opacity-60 cursor-not-allowed" : "")}
                              value={f.isPreorder ? "" : qtyOf("", r.key)}
                              disabled={f.isPreorder}
                              placeholder={f.isPreorder ? "—" : undefined}
                              onChange={(e) => setQty("", r.key, e.target.value)}
                              aria-label={`Quantity for size ${i + 1}`}
                            />
                          </div>
                        )}
                        <div className={hasColors ? "" : "max-[600px]:hidden"}>
                          {i === 0 && <span className={labelClass}>+ Price</span>}
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className={numClass}
                            value={r.additionalPrice}
                            onChange={(e) => setSize(i, "additionalPrice", e.target.value)}
                            placeholder="0.00"
                            aria-label={`Extra price for size ${i + 1}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSize(i)}
                          aria-label={`Remove size ${i + 1}`}
                          className="w-9 h-11 grid place-items-center rounded-xl border border-white/12 text-ink-faint cursor-pointer transition-colors hover:text-[#ff8d8d] hover:border-[rgba(255,141,141,0.4)] [&_svg]:w-4 [&_svg]:h-4 light:border-[rgba(26,13,18,0.12)]"
                        >
                          {ICONS.close}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Stock grid: one cell per colour × size combination. */}
            {hasColors && hasSizes && !f.isPreorder && (
              <div className="flex flex-col gap-2.5 pt-3.5 border-t border-white/[0.08] light:border-[rgba(26,13,18,0.08)]">
                <span className={labelClass + " mb-0"}>Stock</span>
                <div className="overflow-x-auto">
                  <table className="border-separate border-spacing-1.5 -m-1.5">
                    <thead>
                      <tr>
                        <th />
                        {filledSizes.map((r) => (
                          <th
                            key={r.key}
                            scope="col"
                            className="font-sans text-[11px] font-bold tracking-[0.08em] uppercase text-ink-faint text-left whitespace-nowrap"
                          >
                            {r.value.trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filledColors.map((c) => (
                        <tr key={c.key}>
                          <th
                            scope="row"
                            className="font-sans text-[13px] font-normal text-ink-dim text-left pr-2 whitespace-nowrap"
                          >
                            {c.name.trim()}
                          </th>
                          {filledSizes.map((r) => (
                            <td key={r.key}>
                              <input
                                type="number"
                                min={0}
                                step="1"
                                className={numClass + " w-[76px]"}
                                value={qtyOf(c.key, r.key)}
                                onChange={(e) => setQty(c.key, r.key, e.target.value)}
                                aria-label={`Quantity for ${variantLabel(c.name.trim(), r.value.trim())}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {product && hasLines && (
              <p className="font-sans text-[11px] leading-[1.5] text-ink-faint m-0">
                A size, colour or combination that has already been ordered can&apos;t be
                removed. Set its quantity to 0 instead, so those orders keep a record of what
                was bought.
              </p>
            )}
          </div>
          )}

          <div>
            <label className={labelClass}>Product image</label>
            <div className="flex items-center gap-3">
              <span className="relative w-14 h-14 rounded-xl overflow-hidden bg-canvas-2 border border-white/10 shrink-0 light:border-[rgba(26,13,18,0.1)]">
                <ProductThumb src={f.imageUrl.trim() || coverFallback?.imageUrl.trim() || null} alt="" />
              </span>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className={btnOutline + " disabled:opacity-60 disabled:cursor-not-allowed"}
                  >
                    {uploading ? "Uploading…" : "Upload image"}
                  </button>
                  <span className="font-sans text-[11px] text-ink-faint">
                    JPEG, PNG, WebP or GIF · max 5&nbsp;MB
                  </span>
                </div>
                <input
                  className={fieldClass}
                  value={f.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="…or paste an image URL (https://…)"
                />
                {/* Mirrors the API: with no image of its own, a product takes
                    its first colour's photo as the cover. */}
                {!f.imageUrl.trim() && coverFallback && (
                  <p className="font-sans text-[11px] leading-[1.5] text-ink-faint m-0">
                    No image chosen, so the {coverFallback.name.trim()} photo will be used as the cover.
                  </p>
                )}
              </div>
            </div>
            {uploadError && (
              <p className="mt-1.5 font-sans text-[12px] text-[#ff8d8d]">{uploadError}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-5 pt-1">
            <Toggle label="Featured" checked={f.featured} onChange={(v) => set("featured", v)} />
            {/* A download never runs short, so it is never a preorder. */}
            {!f.isDigital && (
              <Toggle
                label="Preorder (card or bank transfer only)"
                checked={f.isPreorder}
                onChange={(v) => set("isPreorder", v)}
              />
            )}
            <Toggle label="Active (visible in store)" checked={f.active} onChange={(v) => set("active", v)} />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 px-7 py-5 border-t border-white/[0.06] bg-canvas-elev light:bg-card light:border-[rgba(26,13,18,0.06)]">
          <button type="button" onClick={onCancel} disabled={busy} className={btnOutline}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={busy || uploading || uploadingColor !== null} className={btnSolid}>
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
