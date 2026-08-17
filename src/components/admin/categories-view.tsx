"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminCategory } from "@/lib/queries/admin";
import { slugifyCategory, type CategoryFormData } from "@/lib/admin/options";
import { isHygieneExcluded } from "@/lib/account/returns";
import { ProductThumb, btnSolid, btnOutline, cardClass, ICONS } from "@/components/admin/shared";

const fieldClass =
  "w-full h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink " +
  "placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";
const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5";

export function CategoriesView({
  categories,
  productCounts,
  onCreate,
  onUpdate,
  onDelete,
}: {
  categories: AdminCategory[];
  /** Products per category id, derived from the live catalog. */
  productCounts: Record<string, number>;
  onCreate: (data: CategoryFormData) => Promise<boolean>;
  onUpdate: (id: string, data: CategoryFormData) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminCategory | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (data: CategoryFormData) => {
    setBusy(true);
    const ok = editing ? await onUpdate(editing.id, data) : await onCreate(data);
    setBusy(false);
    if (ok) {
      setEditing(null);
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[26px] text-ink m-0">Categories</h2>
            <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5 max-w-[560px]">
              Every category below is a filter chip on the{" "}
              <span className="text-ink">Jewelry</span> page and a page of its own. Add one
              here and it appears in the store, and in the product form&apos;s Category
              dropdown, straight away.
            </p>
          </div>
          <button type="button" onClick={() => setAdding(true)} className={btnSolid}>
            <span className="inline-flex items-center gap-2 [&_svg]:w-4 [&_svg]:h-4">
              {ICONS.plus} Add category
            </span>
          </button>
        </div>
      </div>

      <div className={cardClass}>
        {categories.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            No categories yet. Add one to start filing products.
          </p>
        ) : (
          <div className="flex flex-col">
            {categories.map((c, i) => {
              const count = productCounts[c.id] ?? 0;
              return (
              <div
                key={c.id}
                className={
                  "flex flex-wrap items-center gap-4 py-4 " +
                  (i > 0
                    ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]"
                    : "")
                }
              >
                <span className="relative w-12 h-12 rounded-xl overflow-hidden bg-canvas-2 border border-white/10 shrink-0 light:border-[rgba(26,13,18,0.1)]">
                  <ProductThumb src={c.imageUrl} alt="" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="font-sans text-[14px] font-semibold text-ink">{c.name}</span>
                    <code className="font-mono text-[11px] text-ink-faint">
                      /products?category={c.slug}
                    </code>
                  </div>
                  {c.description && (
                    <p className="font-sans text-[12px] leading-[1.5] text-ink-dim m-0 mt-1 line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Pill>
                      {count} product{count === 1 ? "" : "s"}
                    </Pill>
                    <Pill>
                      {isHygieneExcluded(c.slug)
                        ? "Returns: sealed only"
                        : "Returns: if unused"}
                    </Pill>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className={btnOutline}
                    aria-label={`Edit ${c.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(c)}
                    disabled={count > 0}
                    title={count > 0 ? "Move its products elsewhere before deleting" : undefined}
                    className={
                      "py-2.5 px-4 rounded-full border-0 font-sans text-[11px] font-bold tracking-[0.12em] " +
                      "uppercase cursor-pointer transition-colors bg-[rgba(255,141,141,0.16)] text-[#ff8d8d] " +
                      "hover:bg-[rgba(255,141,141,0.26)] disabled:opacity-40 disabled:cursor-not-allowed " +
                      "disabled:hover:bg-[rgba(255,141,141,0.16)]"
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="font-sans text-[12px] leading-[1.6] text-ink-faint m-0 px-1">
        <span className="text-ink-dim">Note:</span> the &ldquo;Returns&rdquo; label reflects the
        published hygiene exclusion, which treats anything that is not merchandise or an
        accessory as returnable only while sealed. A new category is classified as
        sealed-only until a developer says otherwise.
      </p>

      {(adding || editing) && (
        <CategoryForm
          category={editing}
          existingSlugs={categories.filter((c) => c.id !== editing?.id).map((c) => c.slug)}
          busy={busy}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSubmit={submit}
        />
      )}

      {confirmDelete && (
        <ModalShell onClose={() => setConfirmDelete(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-[440px] rounded-[22px] border border-line-pink bg-canvas-elev p-7 shadow-[0_30px_80px_rgba(0,0,0,0.6)] light:bg-card"
          >
            <h3 className="font-display text-[20px] text-ink">
              Delete “{confirmDelete.name}”?
            </h3>
            <p className="mt-2 font-sans text-[13px] text-ink-dim leading-relaxed">
              Its filter chip and its page at{" "}
              <code className="font-mono text-[12px] text-ink">
                /products?category={confirmDelete.slug}
              </code>{" "}
              will stop working. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className={btnOutline}
              >
                Keep it
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const ok = await onDelete(confirmDelete.id);
                  setBusy(false);
                  if (ok) setConfirmDelete(null);
                }}
                className="py-2.5 px-4 rounded-full border-0 bg-[rgba(255,141,141,0.16)] text-[#ff8d8d] font-sans text-[11px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-[rgba(255,141,141,0.26)] disabled:opacity-60"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/**
 * Scrim + centering for a modal. The backdrop is a real button rather than a
 * div with a click handler, so dismissing works from the keyboard and the
 * dialog needs no stopPropagation.
 */
function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[300] grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default border-0 bg-black/60 backdrop-blur-[6px]"
      />
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/12 py-0.5 px-2.5 font-sans text-[11px] leading-[1.5] text-ink-faint light:border-[rgba(26,13,18,0.12)]">
      {children}
    </span>
  );
}

// --- Form --------------------------------------------------------------------

function CategoryForm({
  category,
  existingSlugs,
  busy,
  onCancel,
  onSubmit,
}: {
  category: AdminCategory | null;
  existingSlugs: string[];
  busy: boolean;
  onCancel: () => void;
  onSubmit: (data: CategoryFormData) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? "");
  const [seoTitle, setSeoTitle] = useState(category?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(category?.seoDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Blank means "derive from the name", which is what most people want.
  const effectiveSlug = slugifyCategory(slug || name);
  const slugTaken = effectiveSlug !== "" && existingSlugs.includes(effectiveSlug);
  const slugChanged = category !== null && effectiveSlug !== category.slug;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Upload failed.");
      setImageUrl(json.url as string);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return setError("Name is required.");
    if (!effectiveSlug)
      return setError("The name needs at least one letter or number to build a web address.");
    if (slugTaken) return setError("Another category already uses that web address.");
    setError(null);
    onSubmit({
      name: name.trim(),
      slug: effectiveSlug,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
    });
  };

  return (
    <ModalShell onClose={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[22px] border border-line-pink bg-canvas-elev shadow-[0_30px_80px_rgba(0,0,0,0.6)] light:bg-card"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-7 py-5 border-b border-white/[0.06] bg-canvas-elev light:bg-card light:border-[rgba(26,13,18,0.06)]">
          <h3 className="font-display text-[22px] text-ink">
            {category ? "Edit category" : "Add category"}
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
            <label className={labelClass} htmlFor="cat-name">
              Category name
            </label>
            <input
              id="cat-name"
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nipple Jewelry"
            />
            <p className="mt-1.5 font-sans text-[11px] text-ink-faint">
              Shown on the filter chip and as the page heading.
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="cat-slug">
              Web address
            </label>
            <input
              id="cat-slug"
              className={fieldClass}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={slugifyCategory(name) || "nipple-jewelry"}
            />
            <p className="mt-1.5 font-sans text-[11px] text-ink-faint">
              {effectiveSlug ? (
                <>
                  Customers will see{" "}
                  <code className="font-mono text-ink-dim">
                    /products?category={effectiveSlug}
                  </code>
                  . Leave blank to build it from the name.
                </>
              ) : (
                <>Leave blank to build it from the name.</>
              )}
            </p>
            {slugTaken && (
              <p className="mt-1.5 font-sans text-[12px] text-[#ff8d8d]">
                Another category already uses that address.
              </p>
            )}
            {slugChanged && !slugTaken && (
              <p className="mt-1.5 font-sans text-[12px] text-gold">
                Changing this breaks any link already shared to{" "}
                <code className="font-mono">/products?category={category.slug}</code>.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="cat-desc">
              Description
            </label>
            <textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Curved barbells, dangles & opal centrepieces."
              className="w-full px-3.5 py-3 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink resize-y light:bg-white light:border-[rgba(26,13,18,0.12)]"
            />
            <p className="mt-1.5 font-sans text-[11px] text-ink-faint">
              Appears under the heading on the category page, and on the homepage card.
            </p>
          </div>

          <div>
            <span className={labelClass}>Category image</span>
            <div className="flex items-center gap-3">
              <span className="relative w-14 h-14 rounded-xl overflow-hidden bg-canvas-2 border border-white/10 shrink-0 light:border-[rgba(26,13,18,0.1)]">
                <ProductThumb src={imageUrl.trim() || null} alt="" />
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
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="…or paste an image URL (https://…)"
                />
              </div>
            </div>
            {uploadError && (
              <p className="mt-1.5 font-sans text-[12px] text-[#ff8d8d]">{uploadError}</p>
            )}
          </div>

          <details className="rounded-xl border border-white/[0.08] px-4 py-3 light:border-[rgba(26,13,18,0.08)]">
            <summary className="cursor-pointer font-sans text-[12px] font-bold tracking-[0.12em] uppercase text-ink-faint">
              Search engine listing
            </summary>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className={labelClass} htmlFor="cat-seo-title">
                  SEO title
                </label>
                <input
                  id="cat-seo-title"
                  className={fieldClass}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Defaults to the category name"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="cat-seo-desc">
                  SEO description
                </label>
                <input
                  id="cat-seo-desc"
                  className={fieldClass}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Defaults to the description above"
                />
              </div>
            </div>
          </details>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 px-7 py-5 border-t border-white/[0.06] bg-canvas-elev light:bg-card light:border-[rgba(26,13,18,0.06)]">
          <button type="button" onClick={onCancel} disabled={busy} className={btnOutline}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || uploading || slugTaken}
            className={btnSolid + " disabled:opacity-60 disabled:cursor-not-allowed"}
          >
            {busy ? "Saving…" : category ? "Save category" : "Create category"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
