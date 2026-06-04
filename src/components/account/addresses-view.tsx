"use client";

import { useState, type FormEvent } from "react";
import type { AccountAddress } from "@/lib/queries/account";
import { btnSolid } from "./shared";

export function AddressesView({
  addresses,
  onAdd,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  addresses: AccountAddress[];
  onAdd: () => void;
  onEdit: (a: AccountAddress) => void;
  onSetDefault: (id: string) => void;
  onDelete: (a: AccountAddress) => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[30px] leading-tight text-ink m-0">Addresses</h2>
        <p className="font-sans text-[13px] text-ink-dim m-0 mt-1.5">
          Manage where your SherryBerries pieces are sent.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
        {addresses.map((a) => (
          <div
            key={a.id}
            className={
              "relative rounded-[18px] border p-6 flex flex-col " +
              (a.isDefault
                ? "border-pink/30 bg-[linear-gradient(140deg,rgba(255,79,163,0.1),rgba(255,79,163,0.02))]"
                : "border-white/[0.06] bg-card light:border-[rgba(26,13,18,0.08)]")
            }
          >
            {a.isDefault && (
              <span className="absolute top-4 right-4 font-sans text-[10px] font-bold tracking-[0.12em] uppercase text-blush">
                ✦ Default
              </span>
            )}
            <p className="font-sans text-[15px] font-semibold text-ink m-0 mb-2">
              {a.fullName}
            </p>
            <address className="not-italic font-sans text-[13px] leading-[1.7] text-ink-dim m-0 flex-1">
              {a.line1}
              {a.line2 && <><br />{a.line2}</>}
              <br />
              {[a.city, a.region].filter(Boolean).join(", ")} {a.postal}
              <br />
              {a.country}
              {a.phone && <><br />{a.phone}</>}
            </address>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]">
              {!a.isDefault && (
                <button
                  type="button"
                  onClick={() => onSetDefault(a.id)}
                  className="bg-transparent border-0 cursor-pointer p-0 font-sans text-[11px] font-bold tracking-[0.1em] uppercase text-blush hover:text-pink transition-colors"
                >
                  Set default
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(a)}
                className="bg-transparent border-0 cursor-pointer p-0 font-sans text-[11px] font-bold tracking-[0.1em] uppercase text-ink-dim hover:text-ink transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(a)}
                className="bg-transparent border-0 cursor-pointer p-0 font-sans text-[11px] font-bold tracking-[0.1em] uppercase text-ink-faint hover:text-[#ff8d8d] transition-colors ml-auto"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* Add new tile */}
        <button
          type="button"
          onClick={onAdd}
          className={
            "min-h-[180px] rounded-[18px] border-2 border-dashed border-line-strong bg-transparent cursor-pointer " +
            "grid place-items-center text-center transition-[border-color,color] duration-200 " +
            "hover:border-pink/50 group"
          }
        >
          <span className="font-sans text-[13px] font-semibold tracking-[0.06em] text-ink-faint group-hover:text-blush transition-colors">
            <span className="block text-[28px] mb-1">+</span>
            Add new address
          </span>
        </button>
      </div>
    </div>
  );
}

// --- Add / Edit form (rendered inside the shell modal) ----------------------

const fieldClass =
  "w-full h-11 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] " +
  "font-sans text-[14px] text-ink placeholder:text-ink-faint outline-none " +
  "transition-[border-color,background-color] duration-200 focus:border-pink focus:bg-pink/[0.04] " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";
const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5";

export function AddressForm({
  address,
  busy,
  onCancel,
  onSubmit,
}: {
  address: AccountAddress | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    firstName: address?.firstName ?? "",
    lastName: address?.lastName ?? "",
    phone: address?.phone ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    region: address?.region ?? "",
    postal: address?.postal ?? "",
    country: address?.country ?? "Trinidad and Tobago",
    isDefault: address?.isDefault ?? false,
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.firstName.trim()) return setError("First name is required.");
    if (!form.line1.trim()) return setError("Address line 1 is required.");
    if (!form.city.trim()) return setError("City is required.");
    setError(null);
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="font-display text-[26px] text-ink m-0 mb-5">
        {address ? "Edit address" : "Add address"}
      </h2>

      <div className="grid grid-cols-2 gap-3.5 max-[480px]:grid-cols-1">
        <Field label="First name" required>
          <input className={fieldClass} value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} autoComplete="given-name" />
        </Field>
        <Field label="Last name">
          <input className={fieldClass} value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} autoComplete="family-name" />
        </Field>
        <Field label="Phone" span2>
          <input className={fieldClass} value={form.phone} onChange={(e) => set("phone")(e.target.value)} autoComplete="tel" />
        </Field>
        <Field label="Address line 1" required span2>
          <input className={fieldClass} value={form.line1} onChange={(e) => set("line1")(e.target.value)} autoComplete="address-line1" />
        </Field>
        <Field label="Address line 2" span2>
          <input className={fieldClass} value={form.line2} onChange={(e) => set("line2")(e.target.value)} autoComplete="address-line2" />
        </Field>
        <Field label="City" required>
          <input className={fieldClass} value={form.city} onChange={(e) => set("city")(e.target.value)} autoComplete="address-level2" />
        </Field>
        <Field label="State / Region">
          <input className={fieldClass} value={form.region} onChange={(e) => set("region")(e.target.value)} autoComplete="address-level1" />
        </Field>
        <Field label="Postal code">
          <input className={fieldClass} value={form.postal} onChange={(e) => set("postal")(e.target.value)} autoComplete="postal-code" />
        </Field>
        <Field label="Country">
          <input className={fieldClass} value={form.country} onChange={(e) => set("country")(e.target.value)} autoComplete="country-name" />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 mt-4 cursor-pointer font-sans text-[13px] text-ink-dim">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
          className="accent-pink w-4 h-4"
        />
        Set as default address
      </label>

      {error && <p className="font-sans text-[13px] text-[#ff8d8d] m-0 mt-3">{error}</p>}

      <div className="flex justify-end gap-2.5 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="py-2.5 px-5 rounded-full border border-white/14 bg-transparent text-ink-dim font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer hover:text-ink hover:border-blush transition-colors light:border-[rgba(26,13,18,0.14)]"
        >
          Cancel
        </button>
        <button type="submit" disabled={busy} className={btnSolid}>
          {busy ? "Saving…" : "Save address"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  span2,
  children,
}: {
  label: string;
  required?: boolean;
  span2?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={span2 ? "col-span-2 max-[480px]:col-span-1" : ""}>
      <span className={labelClass}>
        {label}
        {required && <span className="text-pink"> *</span>}
      </span>
      {children}
    </div>
  );
}
