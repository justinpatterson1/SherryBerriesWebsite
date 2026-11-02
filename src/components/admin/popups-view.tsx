"use client";

import { useRef, useState, type ReactNode } from "react";
import type { AdminPopup, AdminProduct, AdminPromo } from "@/lib/queries/admin";
import {
  POPUP_LIMITS,
  validatePopup,
  type PopupFormData,
  type PopupFrequency,
  type PopupKind,
  type PopupLayout,
  type PopupPlacement,
} from "@/lib/admin/popup-validate";
import { popupStatus, type PublicPopup } from "@/lib/popups/schedule";
import { PopupCard } from "@/components/popups/popup-card";
import {
  ProductThumb,
  ModalShell,
  PopupStatusBadge,
  btnSolid,
  btnOutline,
  cardPadded,
  ICONS,
} from "@/components/admin/shared";

const fieldClass =
  "w-full h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink " +
  "placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";
const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5";
const hintClass = "mt-1.5 font-sans text-[11px] leading-[1.5] text-ink-faint";

const KIND_LABEL: Record<PopupKind, string> = {
  ANNOUNCEMENT: "Announcement",
  NEWSLETTER: "Newsletter signup",
};
const PLACEMENT_LABEL: Record<PopupPlacement, string> = {
  SITE: "Every page",
  CHECKOUT_COMPLETE: "After checkout",
};
/**
 * Starting values for a new popup. A newsletter popup waits long enough for the
 * shopper to look around first, and ranks below announcements so a preorder
 * shows before the signup ask; it shows on a later visit instead.
 */
const KIND_DEFAULTS: Record<PopupKind, { delaySeconds: number; priority: number }> = {
  ANNOUNCEMENT: { delaySeconds: 2, priority: 10 },
  NEWSLETTER: { delaySeconds: 15, priority: 0 },
};

const FREQUENCY_LABEL: Record<PopupFrequency, string> = {
  ONCE: "Once per visitor",
  DAILY: "Once a day",
  SESSION: "Every visit",
};

export function PopupsView({
  popups,
  products,
  promos,
  onCreate,
  onUpdate,
  onDelete,
}: {
  popups: AdminPopup[];
  products: AdminProduct[];
  promos: AdminPromo[];
  onCreate: (data: PopupFormData) => Promise<boolean>;
  onUpdate: (id: string, data: PopupFormData) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<AdminPopup | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminPopup | null>(null);
  const [busy, setBusy] = useState(false);
  // Read once: the badges describe the screen as it was opened, and a clock
  // read during render would differ between renders.
  const [now] = useState(() => Date.now());

  const submit = async (data: PopupFormData) => {
    setBusy(true);
    const ok = editing ? await onUpdate(editing.id, data) : await onCreate(data);
    setBusy(false);
    if (ok) {
      setEditing(null);
      setAdding(false);
    }
  };

  const productName = (id: string | null) => products.find((p) => p.id === id)?.name;

  return (
    <div className="flex flex-col gap-5">
      <div className={cardPadded}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[26px] text-ink m-0">Popups</h2>
            <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5 max-w-[580px]">
              Announce a drop or grow the Berry List with your own artwork. Shoppers see
              one popup at a time: the live one with the highest priority that they
              haven&apos;t already seen.
            </p>
          </div>
          <button type="button" onClick={() => setAdding(true)} className={btnSolid}>
            <span className="inline-flex items-center gap-2 [&_svg]:w-4 [&_svg]:h-4">
              {ICONS.plus} New popup
            </span>
          </button>
        </div>
      </div>

      <div className={cardPadded}>
        {popups.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            No popups yet. Create one to announce a preorder or invite shoppers to the list.
          </p>
        ) : (
          <div className="flex flex-col">
            {popups.map((p, i) => (
              <div
                key={p.id}
                className={
                  "flex flex-wrap items-center gap-4 py-4 " +
                  (i > 0 ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]" : "")
                }
              >
                <span className="relative w-16 h-16 rounded-xl overflow-hidden bg-canvas-2 border border-white/10 shrink-0 light:border-[rgba(26,13,18,0.1)]">
                  <ProductThumb src={p.imageUrl} alt="" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-sans text-[14px] font-semibold text-ink">{p.name}</span>
                    <PopupStatusBadge status={popupStatus(p, now)} />
                  </div>
                  <p className="font-sans text-[12px] leading-[1.5] text-ink-dim m-0 mt-1 line-clamp-1">
                    {p.headline}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Pill>{KIND_LABEL[p.kind]}</Pill>
                    <Pill>{PLACEMENT_LABEL[p.placement]}</Pill>
                    {p.productId && <Pill>→ {productName(p.productId) ?? "Product"}</Pill>}
                    {p.showCountdown && <Pill>Countdown</Pill>}
                    {p.promoCodeId && (
                      <Pill>Code: {promos.find((c) => c.id === p.promoCodeId)?.code ?? "?"}</Pill>
                    )}
                    {p.endsAt && <Pill>Ends {formatWhen(p.endsAt)}</Pill>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className={btnOutline}
                    aria-label={`Edit ${p.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(p)}
                    className="py-2.5 px-4 rounded-full border-0 font-sans text-[11px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-colors bg-[rgba(255,141,141,0.16)] text-[#ff8d8d] hover:bg-[rgba(255,141,141,0.26)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(adding || editing) && (
        <PopupForm
          popup={editing}
          products={products}
          promos={promos}
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
            <h3 className="font-display text-[20px] text-ink">Delete “{confirmDelete.name}”?</h3>
            <p className="mt-2 font-sans text-[13px] text-ink-dim leading-relaxed">
              It stops showing straight away. To pause it instead, edit it and switch it off.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)} className={btnOutline}>
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

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/12 py-0.5 px-2.5 font-sans text-[11px] leading-[1.5] text-ink-faint light:border-[rgba(26,13,18,0.12)]">
      {children}
    </span>
  );
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** ISO → the "yyyy-mm-ddThh:mm" a datetime-local input shows, in the admin's timezone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** The reverse: the browser parses a datetime-local value as local time. */
function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

// --- Form --------------------------------------------------------------------

function PopupForm({
  popup,
  products,
  promos,
  busy,
  onCancel,
  onSubmit,
}: {
  popup: AdminPopup | null;
  products: AdminProduct[];
  promos: AdminPromo[];
  busy: boolean;
  onCancel: () => void;
  onSubmit: (data: PopupFormData) => void;
}) {
  const [name, setName] = useState(popup?.name ?? "");
  const [kind, setKind] = useState<PopupKind>(popup?.kind ?? "ANNOUNCEMENT");
  const [layout, setLayout] = useState<PopupLayout>(popup?.layout ?? "IMAGE_TEXT");
  const [placement, setPlacement] = useState<PopupPlacement>(popup?.placement ?? "SITE");
  const [imageUrl, setImageUrl] = useState(popup?.imageUrl ?? "");
  const [headline, setHeadline] = useState(popup?.headline ?? "");
  const [body, setBody] = useState(popup?.body ?? "");
  const [ctaLabel, setCtaLabel] = useState(popup?.ctaLabel ?? "");
  const [linkTo, setLinkTo] = useState<"product" | "url" | "none">(
    popup ? (popup.productId ? "product" : popup.ctaUrl ? "url" : "none") : "product",
  );
  const [productId, setProductId] = useState(popup?.productId ?? "");
  const [ctaUrl, setCtaUrl] = useState(popup?.ctaUrl ?? "");
  const [showCountdown, setShowCountdown] = useState(popup?.showCountdown ?? false);
  const [promoCodeId, setPromoCodeId] = useState(popup?.promoCodeId ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(popup?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(popup?.endsAt ?? null));
  const [frequency, setFrequency] = useState<PopupFrequency>(popup?.frequency ?? "ONCE");
  const [delaySeconds, setDelaySeconds] = useState(
    String(popup?.delaySeconds ?? KIND_DEFAULTS.ANNOUNCEMENT.delaySeconds),
  );
  const [priority, setPriority] = useState(
    String(popup?.priority ?? KIND_DEFAULTS.ANNOUNCEMENT.priority),
  );
  const [active, setActive] = useState(popup?.active ?? true);
  const [device, setDevice] = useState<"phone" | "desktop">("phone");

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // On a new popup, switching kind moves the delay and priority to that kind's
  // recommended values — unless the admin has already changed them.
  const chooseKind = (next: PopupKind) => {
    if (!popup) {
      const from = KIND_DEFAULTS[kind];
      const to = KIND_DEFAULTS[next];
      if (delaySeconds === String(from.delaySeconds)) setDelaySeconds(String(to.delaySeconds));
      if (priority === String(from.priority)) setPriority(String(to.priority));
    }
    setKind(next);
  };

  const isAnnouncement = kind === "ANNOUNCEMENT";
  const full = layout === "FULL_GRAPHIC";
  // Every product, preorders first: they are what a countdown popup is usually
  // for. Hidden ones stay listed so a popup can be set up before a launch.
  const productOptions = [...products].sort(
    (a, b) => Number(b.isPreorder) - Number(a.isPreorder) || a.name.localeCompare(b.name),
  );
  const chosenProduct = products.find((p) => p.id === productId);

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

  const raw = {
    name,
    kind,
    layout,
    placement,
    imageUrl,
    headline,
    body,
    ctaLabel: linkTo === "none" ? "" : ctaLabel,
    productId: linkTo === "product" ? productId : "",
    ctaUrl: linkTo === "url" ? ctaUrl : "",
    showCountdown,
    promoCodeId,
    startsAt: fromLocalInput(startsAt),
    endsAt: fromLocalInput(endsAt),
    frequency,
    delaySeconds,
    priority,
    active,
  };

  const handleSubmit = () => {
    const check = validatePopup(raw);
    if (!check.ok) return setError(check.error);
    setError(null);
    onSubmit(check.data);
  };

  // What the shopper would see, rebuilt on every keystroke.
  const preview: PublicPopup = {
    id: popup?.id ?? "preview",
    kind,
    layout,
    imageUrl: imageUrl.trim() || null,
    headline: headline.trim() || (full ? "Your graphic" : "Your headline"),
    body: body.trim() || null,
    ctaLabel: raw.ctaLabel.trim() || null,
    ctaHref:
      linkTo === "product" && productId ? "/products" : linkTo === "url" ? ctaUrl.trim() || null : null,
    showCountdown,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    frequency,
    delaySeconds: 0,
    priority: 0,
    hasReward: !!promoCodeId,
  };

  return (
    <ModalShell onClose={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[1080px] max-h-[92vh] overflow-y-auto rounded-[22px] border border-line-pink bg-canvas-elev shadow-[0_30px_80px_rgba(0,0,0,0.6)] light:bg-card"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-7 py-5 border-b border-white/[0.06] bg-canvas-elev light:bg-card light:border-[rgba(26,13,18,0.06)]">
          <h3 className="font-display text-[22px] text-ink">{popup ? "Edit popup" : "New popup"}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="w-9 h-9 grid place-items-center rounded-full border border-white/12 text-ink-dim cursor-pointer transition-colors hover:text-ink hover:border-blush [&_svg]:w-4 [&_svg]:h-4 light:border-[rgba(26,13,18,0.12)]"
          >
            {ICONS.close}
          </button>
        </div>

        <div className="grid grid-cols-1 min-[900px]:grid-cols-[1fr_420px]">
          {/* Fields */}
          <div className="p-7 flex flex-col gap-7 min-w-0">
            {error && (
              <p className="rounded-xl border border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.1)] px-4 py-2.5 font-sans text-[12px] text-[#ff8d8d]">
                {error}
              </p>
            )}

            <Section step="1" title="What it's for">
              <Choice
                value={kind}
                onChange={chooseKind}
                options={[
                  { value: "ANNOUNCEMENT", label: "Announcement", hint: "A drop, preorder or sale, with a button" },
                  { value: "NEWSLETTER", label: "Newsletter signup", hint: "An email box that joins the Berry List" },
                ]}
              />
              <div>
                <span className={labelClass}>Where it shows</span>
                <Choice
                  value={placement}
                  onChange={setPlacement}
                  options={[
                    { value: "SITE", label: "Every page", hint: "Opens shortly after a shopper arrives" },
                    {
                      value: "CHECKOUT_COMPLETE",
                      label: "After checkout",
                      hint: "On the thank-you screen, once the order is placed",
                    },
                  ]}
                />
                {kind === "NEWSLETTER" && placement === "SITE" && (
                  <p className={hintClass}>
                    Recommended: shoppers can use a reward code on the order they&apos;re
                    about to place.
                  </p>
                )}
                {kind === "NEWSLETTER" && placement === "CHECKOUT_COMPLETE" && (
                  <p className={hintClass}>
                    Shoppers already on the list never see it, and their email is filled in.
                    A reward code here only works on their next order.
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass} htmlFor="popup-name">
                  Name (only you see this)
                </label>
                <input
                  id="popup-name"
                  className={fieldClass}
                  value={name}
                  maxLength={POPUP_LIMITS.nameMax}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAnnouncement ? "Opal preorder: November" : "Checkout Berry List"}
                />
              </div>
            </Section>

            <Section step="2" title="Graphic">
              <Choice
                value={layout}
                onChange={setLayout}
                options={[
                  {
                    value: "IMAGE_TEXT",
                    label: "Image + text",
                    hint: "Upload a photo and type your words below it",
                  },
                  {
                    value: "FULL_GRAPHIC",
                    label: "Full graphic",
                    hint: "Upload a finished design, e.g. from Canva",
                  },
                ]}
              />
              <div>
                <div className="flex items-center gap-3">
                  <span className="relative w-16 h-16 rounded-xl overflow-hidden bg-canvas-2 border border-white/10 shrink-0 light:border-[rgba(26,13,18,0.1)]">
                    <ProductThumb src={imageUrl.trim() || null} alt="" />
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
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
                        {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}
                      </button>
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl("")}
                          className="bg-transparent border-0 p-0 cursor-pointer font-sans text-[11px] text-ink-faint hover:text-ink"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      className={fieldClass}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="…or paste an image URL (https://…)"
                    />
                  </div>
                </div>
                <p className={hintClass}>
                  {full
                    ? "Portrait works best: 1080 × 1350 px (4:5). Keep the bottom third plain: the countdown, button and email box sit there."
                    : "Landscape works best: 1200 × 800 px (3:2). Optional. Without one, the words stand alone."}{" "}
                  JPEG, PNG, WebP or GIF, max 5 MB.
                </p>
                {uploadError && (
                  <p className="mt-1.5 font-sans text-[12px] text-[#ff8d8d]">{uploadError}</p>
                )}
              </div>
            </Section>

            <Section step="3" title={isAnnouncement ? "Words & button" : "Words & reward"}>
              <div>
                <label className={labelClass} htmlFor="popup-headline">
                  {full ? "Describe the graphic" : "Headline"}
                </label>
                <input
                  id="popup-headline"
                  className={fieldClass}
                  value={headline}
                  maxLength={POPUP_LIMITS.headlineMax}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={isAnnouncement ? "The opal drop is here" : "Join the Berry List"}
                />
                {full && (
                  <p className={hintClass}>
                    Type the words on your graphic. Screen readers read them out, and
                    they show if the image can&apos;t load.
                  </p>
                )}
              </div>
              {!full && (
                <div>
                  <label className={labelClass} htmlFor="popup-body">
                    Text
                  </label>
                  <textarea
                    id="popup-body"
                    value={body}
                    maxLength={POPUP_LIMITS.bodyMax}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    placeholder={
                      isAnnouncement
                        ? "Reserve yours before the preorder closes. Ships early December."
                        : "New drops, piercing tips and members-only offers."
                    }
                    className="w-full px-3.5 py-3 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink resize-y light:bg-white light:border-[rgba(26,13,18,0.12)]"
                  />
                </div>
              )}

              {isAnnouncement ? (
                <>
                  <div>
                    <span className={labelClass}>Button goes to</span>
                    <Choice
                      value={linkTo}
                      onChange={setLinkTo}
                      options={[
                        { value: "product", label: "A product" },
                        { value: "url", label: "A link" },
                        { value: "none", label: "No button" },
                      ]}
                    />
                  </div>
                  {linkTo === "product" && (
                    <div>
                      <label className={labelClass} htmlFor="popup-product">
                        Product
                      </label>
                      <select
                        id="popup-product"
                        className={fieldClass + " cursor-pointer"}
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                      >
                        <option value="">Choose a product…</option>
                        {productOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.isPreorder ? "Preorder · " : ""}
                            {p.name}
                            {p.active ? "" : " (hidden)"}
                          </option>
                        ))}
                      </select>
                      {chosenProduct && !chosenProduct.active && (
                        <p className="mt-1.5 font-sans text-[12px] text-gold">
                          This product is hidden from the shop, so the popup shows without its
                          button until you switch the product on.
                        </p>
                      )}
                    </div>
                  )}
                  {linkTo === "url" && (
                    <div>
                      <label className={labelClass} htmlFor="popup-url">
                        Link
                      </label>
                      <input
                        id="popup-url"
                        className={fieldClass}
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="/products?category=nipple-jewelry or https://…"
                      />
                    </div>
                  )}
                  {linkTo !== "none" && (
                    <div>
                      <label className={labelClass} htmlFor="popup-cta">
                        Button text
                      </label>
                      <input
                        id="popup-cta"
                        className={fieldClass}
                        value={ctaLabel}
                        maxLength={POPUP_LIMITS.ctaLabelMax}
                        onChange={(e) => setCtaLabel(e.target.value)}
                        placeholder="Shop the preorder"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className={labelClass} htmlFor="popup-promo">
                    Reward for signing up
                  </label>
                  <select
                    id="popup-promo"
                    className={fieldClass + " cursor-pointer"}
                    value={promoCodeId}
                    onChange={(e) => setPromoCodeId(e.target.value)}
                  >
                    <option value="">No reward</option>
                    {promos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                        {c.percentageOff != null
                          ? ` · ${c.percentageOff}% off`
                          : c.amountOff != null
                            ? ` · $${c.amountOff.toFixed(2)} off`
                            : ""}
                        {c.active ? "" : " (inactive)"}
                      </option>
                    ))}
                  </select>
                  <p className={hintClass}>
                    The code is shown only after they sign up, with a copy button. Create
                    codes under Promo codes.
                  </p>
                </div>
              )}
            </Section>

            <Section step="4" title="Schedule">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="popup-start">
                    Starts
                  </label>
                  <input
                    id="popup-start"
                    type="datetime-local"
                    className={fieldClass}
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                  <p className={hintClass}>Leave blank to start now.</p>
                </div>
                <div>
                  <label className={labelClass} htmlFor="popup-end">
                    Ends
                  </label>
                  <input
                    id="popup-end"
                    type="datetime-local"
                    className={fieldClass}
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                  <p className={hintClass}>It stops showing after this. Leave blank to run until switched off.</p>
                </div>
              </div>

              <Toggle
                checked={showCountdown}
                onChange={setShowCountdown}
                title="Show a countdown to the end date"
                hint={
                  endsAt
                    ? "Days, hours, minutes and seconds left. The popup closes itself when it reaches zero."
                    : "Set an end date above first."
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass} htmlFor="popup-frequency">
                    How often
                  </label>
                  <select
                    id="popup-frequency"
                    className={fieldClass + " cursor-pointer"}
                    value={frequency}
                    disabled={placement === "CHECKOUT_COMPLETE"}
                    onChange={(e) => setFrequency(e.target.value as PopupFrequency)}
                  >
                    {(Object.keys(FREQUENCY_LABEL) as PopupFrequency[]).map((f) => (
                      <option key={f} value={f}>
                        {FREQUENCY_LABEL[f]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="popup-delay">
                    Delay (seconds)
                  </label>
                  <input
                    id="popup-delay"
                    type="number"
                    min={0}
                    max={POPUP_LIMITS.delayMax}
                    className={fieldClass}
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="popup-priority">
                    Priority
                  </label>
                  <input
                    id="popup-priority"
                    type="number"
                    min={0}
                    max={POPUP_LIMITS.priorityMax}
                    className={fieldClass}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                </div>
              </div>
              <p className={hintClass + " -mt-2"}>
                When two popups are live, the higher priority shows first.
              </p>

              <Toggle
                checked={active}
                onChange={setActive}
                title="Switched on"
                hint={active ? "Shows on the dates above." : "Saved but hidden from shoppers."}
              />
            </Section>
          </div>

          {/* Live preview */}
          <div className="border-t min-[900px]:border-t-0 min-[900px]:border-l border-white/[0.06] light:border-[rgba(26,13,18,0.06)] bg-canvas p-6">
            <div className="min-[900px]:sticky min-[900px]:top-[96px] flex flex-col items-center gap-4">
              <div className="flex w-full items-center justify-between">
                <span className={labelClass + " mb-0"}>Preview</span>
                <div className="inline-flex rounded-full border border-white/12 p-0.5 light:border-[rgba(26,13,18,0.12)]">
                  {(["phone", "desktop"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDevice(d)}
                      className={
                        "py-1 px-3 rounded-full border-0 cursor-pointer font-sans text-[10px] font-bold tracking-[0.12em] uppercase transition-colors " +
                        (device === d ? "bg-pink/[0.16] text-blush" : "bg-transparent text-ink-faint hover:text-ink")
                      }
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className={
                  "w-full grid place-items-center rounded-[20px] p-4 bg-black/50 bg-[radial-gradient(circle_at_30%_20%,rgba(255,79,163,0.18),transparent_60%)] " +
                  (device === "phone" ? "max-w-[340px]" : "max-w-[400px]")
                }
              >
                {/* Reset per layout and kind, so a typed email or a finished
                    countdown in the preview does not carry over. */}
                <div className="w-full" key={`${layout}-${kind}`}>
                  <PopupCard popup={preview} source="popup" onClose={() => {}} preview />
                </div>
              </div>
              <p className="font-sans text-[11px] text-ink-faint text-center m-0">
                The button and email box are inactive in the preview.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 flex justify-end gap-3 px-7 py-5 border-t border-white/[0.06] bg-canvas-elev light:bg-card light:border-[rgba(26,13,18,0.06)]">
          <button type="button" onClick={onCancel} disabled={busy} className={btnOutline}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || uploading}
            className={btnSolid + " disabled:opacity-60 disabled:cursor-not-allowed"}
          >
            {busy ? "Saving…" : popup ? "Save popup" : "Create popup"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function Section({ step, title, children }: { step: string; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h4 className="flex items-center gap-2.5 font-display text-[18px] text-ink m-0">
        <span className="w-6 h-6 grid place-items-center rounded-full bg-pink/[0.16] font-sans text-[11px] font-bold text-blush">
          {step}
        </span>
        {title}
      </h4>
      {children}
    </section>
  );
}

function Choice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
}) {
  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={
              "text-left rounded-xl border p-3 cursor-pointer transition-colors " +
              (selected
                ? "border-pink bg-pink/[0.08]"
                : "border-white/10 bg-transparent hover:border-blush light:border-[rgba(26,13,18,0.1)]")
            }
          >
            <span className={"block font-sans text-[13px] font-semibold " + (selected ? "text-ink" : "text-ink-dim")}>
              {o.label}
            </span>
            {o.hint && (
              <span className="block mt-1 font-sans text-[11px] leading-[1.45] text-ink-faint">{o.hint}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-white/10 p-4 cursor-pointer light:border-[rgba(26,13,18,0.1)]">
      <input
        type="checkbox"
        className="mt-0.5 w-4 h-4 accent-pink cursor-pointer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block font-sans text-[13px] font-semibold text-ink">{title}</span>
        <span className="block mt-1 font-sans text-[11px] leading-[1.5] text-ink-faint">{hint}</span>
      </span>
    </label>
  );
}
