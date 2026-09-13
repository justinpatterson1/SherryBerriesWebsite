"use client";

import { useState } from "react";
import type { AdminPromo } from "@/lib/queries/admin";
import {
  promoLabel,
  promoState,
  type PromoFormData,
  type PromoState,
} from "@/lib/admin/promo-validate";
import { btnOutline, btnSolid, cardPadded, ICONS } from "@/components/admin/shared";

// Promo codes a customer types into the box on the cart or checkout page. The
// state pill is computed by promoState(), which mirrors the usability test in
// /api/checkout — so this screen can never show "Active" for a code the
// checkout would refuse.

const STATE_STYLE: Record<PromoState, string> = {
  Active: "text-[#7ee0a8] border-[rgba(126,224,168,0.3)] bg-[rgba(126,224,168,0.12)]",
  Inactive: "text-ink-faint border-white/12 bg-white/[0.05]",
  Expired: "text-gold border-gold/40 bg-gold/[0.12]",
  "Used up": "text-[#ff8d8d] border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.12)]",
};

const fieldClass =
  "w-full h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[14px] text-ink " +
  "placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";
const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5";

/** ISO timestamp → the yyyy-mm-dd a date input expects. */
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function PromosView({
  promos,
  onCreate,
  onUpdate,
  onDelete,
}: {
  promos: AdminPromo[];
  onCreate: (data: PromoFormData) => Promise<boolean>;
  onUpdate: (id: string, data: PromoFormData) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<AdminPromo | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (data: PromoFormData) => {
    setBusy(true);
    const ok = editing ? await onUpdate(editing.id, data) : await onCreate(data);
    setBusy(false);
    if (ok) {
      setEditing(null);
      setAdding(false);
    }
  };

  const toggleActive = async (p: AdminPromo) => {
    setBusy(true);
    await onUpdate(p.id, {
      code: p.code,
      percentageOff: p.percentageOff,
      amountOff: p.amountOff,
      usageLimit: p.usageLimit,
      expiresAt: toDateInput(p.expiresAt),
      active: !p.active,
    });
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className={cardPadded}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[26px] text-ink m-0">Promo codes</h2>
            <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5 max-w-[560px]">
              Codes customers type into the promo box on the bag and at checkout. A code
              works the moment it is created — there is no scheduling, so create it when
              you want it live, or switch it off until then.
            </p>
          </div>
          <button type="button" onClick={() => setAdding(true)} className={btnSolid}>
            <span className="inline-flex items-center gap-2 [&_svg]:w-4 [&_svg]:h-4">
              {ICONS.plus} New code
            </span>
          </button>
        </div>
      </div>

      <div className={cardPadded}>
        {promos.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            No codes yet. Create one and it can be used straight away.
          </p>
        ) : (
          <div className="flex flex-col">
            {promos.map((p, i) => {
              const state = promoState({ ...p, expiresAt: p.expiresAt });
              return (
                <div
                  key={p.id}
                  className={
                    "flex flex-wrap items-center gap-4 py-4 " +
                    (i > 0
                      ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]"
                      : "")
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <code className="font-mono text-[15px] font-semibold text-ink tracking-[0.06em]">
                        {p.code}
                      </code>
                      <span className="font-sans text-[13px] text-blush">
                        {promoLabel(p.percentageOff, p.amountOff)}
                      </span>
                      <span
                        className={
                          "rounded-full border py-0.5 px-2.5 font-sans text-[11px] font-semibold " +
                          STATE_STYLE[state]
                        }
                      >
                        {state}
                      </span>
                    </div>
                    <p className="font-sans text-[12px] text-ink-faint m-0 mt-1.5">
                      Used {p.timesUsed}
                      {p.usageLimit != null ? ` of ${p.usageLimit}` : " times"}
                      {p.expiresAt
                        ? ` · expires ${new Date(p.expiresAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : " · no expiry"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => toggleActive(p)}
                      className={btnOutline + " disabled:opacity-60"}
                    >
                      {p.active ? "Switch off" : "Switch on"}
                    </button>
                    <button type="button" onClick={() => setEditing(p)} className={btnOutline}>
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy || p.timesUsed > 0}
                      title={
                        p.timesUsed > 0
                          ? "This code has been used on real orders — switch it off instead"
                          : undefined
                      }
                      onClick={async () => {
                        setBusy(true);
                        await onDelete(p.id);
                        setBusy(false);
                      }}
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
        <span className="text-ink-dim">Note:</span> a code that has been used cannot be
        deleted — switching it off stops it working immediately and keeps the record of the
        orders it was applied to. A percentage applies to the bag subtotal; a fixed amount
        never takes the subtotal below zero.
      </p>

      {(adding || editing) && (
        <PromoForm
          promo={editing}
          busy={busy}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

// --- Form --------------------------------------------------------------------

function PromoForm({
  promo,
  busy,
  onCancel,
  onSubmit,
}: {
  promo: AdminPromo | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (data: PromoFormData) => void;
}) {
  const [code, setCode] = useState(promo?.code ?? "");
  // Which of the two value fields is in play. Stored as a mode rather than
  // inferred, so clearing one field cannot leave the form ambiguous.
  const [mode, setMode] = useState<"percent" | "amount">(
    promo?.amountOff != null ? "amount" : "percent",
  );
  const [percent, setPercent] = useState(
    promo?.percentageOff != null ? String(promo.percentageOff) : "",
  );
  const [amount, setAmount] = useState(promo?.amountOff != null ? String(promo.amountOff) : "");
  const [limit, setLimit] = useState(promo?.usageLimit != null ? String(promo.usageLimit) : "");
  const [expires, setExpires] = useState(toDateInput(promo?.expiresAt ?? null));
  const [active, setActive] = useState(promo?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    onSubmit({
      code,
      percentageOff: mode === "percent" && percent.trim() !== "" ? Number(percent) : null,
      amountOff: mode === "amount" && amount.trim() !== "" ? Number(amount) : null,
      usageLimit: limit.trim() === "" ? null : Number(limit),
      expiresAt: expires,
      active,
    });
  };

  return (
    <div className="fixed inset-0 z-[300] grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 w-full h-full cursor-default border-0 bg-black/60 backdrop-blur-[6px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-[22px] border border-line-pink bg-canvas-elev shadow-[0_30px_80px_rgba(0,0,0,0.6)] light:bg-card"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-7 py-5 border-b border-white/[0.06] bg-canvas-elev light:bg-card light:border-[rgba(26,13,18,0.06)]">
          <h3 className="font-display text-[22px] text-ink">
            {promo ? "Edit code" : "New code"}
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
            <p className="rounded-xl border border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.1)] px-4 py-2.5 font-sans text-[12px] text-[#ff8d8d] m-0">
              {error}
            </p>
          )}

          <div>
            <label className={labelClass} htmlFor="promo-code">
              Code
            </label>
            <input
              id="promo-code"
              className={fieldClass + " font-mono tracking-[0.08em] uppercase"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="BERRY10"
            />
            <p className="mt-1.5 font-sans text-[11px] text-ink-faint">
              Letters and numbers only. Customers can type it in any case.
            </p>
          </div>

          <div>
            <span className={labelClass}>Discount</span>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setMode("percent")}
                className={mode === "percent" ? btnSolid : btnOutline}
              >
                Percentage
              </button>
              <button
                type="button"
                onClick={() => setMode("amount")}
                className={mode === "amount" ? btnSolid : btnOutline}
              >
                Fixed amount
              </button>
            </div>
            {mode === "percent" ? (
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                className={fieldClass}
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                placeholder="10"
                aria-label="Percentage off"
              />
            ) : (
              <input
                type="number"
                min={0}
                step="0.01"
                className={fieldClass}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50.00"
                aria-label="Amount off"
              />
            )}
            <p className="mt-1.5 font-sans text-[11px] text-ink-faint">
              {mode === "percent"
                ? "Taken off the bag subtotal, before shipping."
                : "A flat amount off; it will never take the subtotal below zero."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="promo-limit">
                Usage limit
              </label>
              <input
                id="promo-limit"
                type="number"
                min={1}
                step={1}
                className={fieldClass}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="Unlimited"
              />
              {promo && promo.timesUsed > 0 && (
                <p className="mt-1.5 font-sans text-[11px] text-ink-faint">
                  Already used {promo.timesUsed} time{promo.timesUsed === 1 ? "" : "s"}.
                </p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="promo-expires">
                Expires
              </label>
              <input
                id="promo-expires"
                type="date"
                className={fieldClass}
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
              <p className="mt-1.5 font-sans text-[11px] text-ink-faint">
                Works to the end of that day. Leave blank for no expiry.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActive(!active)}
            className="inline-flex items-center gap-2.5 cursor-pointer self-start"
          >
            <span
              className={
                "relative w-10 h-6 rounded-full transition-colors duration-200 " +
                (active ? "bg-pink" : "bg-white/12 light:bg-[rgba(26,13,18,0.14)]")
              }
            >
              <span
                className={
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 " +
                  (active ? "translate-x-[18px]" : "translate-x-0.5")
                }
              />
            </span>
            <span className="font-sans text-[13px] text-ink-dim">
              Active — customers can use it now
            </span>
          </button>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 px-7 py-5 border-t border-white/[0.06] bg-canvas-elev light:bg-card light:border-[rgba(26,13,18,0.06)]">
          <button type="button" onClick={onCancel} disabled={busy} className={btnOutline}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={busy} className={btnSolid}>
            {busy ? "Saving…" : promo ? "Save code" : "Create code"}
          </button>
        </div>
      </div>
    </div>
  );
}
