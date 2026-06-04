"use client";

import { useState, type FormEvent } from "react";
import type { AccountProfile } from "@/lib/queries/account";
import { btnSolid, cardClass } from "./shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  "w-full h-12 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] " +
  "font-sans text-[14px] text-ink placeholder:text-ink-faint outline-none " +
  "transition-[border-color,background-color] duration-200 focus:border-pink focus:bg-pink/[0.04] " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";
const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5";

export function ProfileView({
  profile,
  onSave,
}: {
  profile: AccountProfile;
  onSave: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.firstName.trim()) return setError("First name is required.");
    if (!EMAIL_RE.test(form.email)) return setError("Enter a valid email address.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    setError(null);
    setSaving(true);
    await onSave({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[30px] leading-tight text-ink m-0">Profile</h2>
        <p className="font-sans text-[13px] text-ink-dim m-0 mt-1.5">
          Member since {profile.memberSince}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={cardClass}>
        <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
          <div>
            <label className={labelClass} htmlFor="pf-first">
              First name<span className="text-pink"> *</span>
            </label>
            <input id="pf-first" className={fieldClass} value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} autoComplete="given-name" />
          </div>
          <div>
            <label className={labelClass} htmlFor="pf-last">Last name</label>
            <input id="pf-last" className={fieldClass} value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} autoComplete="family-name" />
          </div>
          <div className="col-span-2 max-[560px]:col-span-1">
            <label className={labelClass} htmlFor="pf-email">
              Email<span className="text-pink"> *</span>
            </label>
            <input id="pf-email" type="email" className={fieldClass} value={form.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" />
          </div>
          <div className="col-span-2 max-[560px]:col-span-1">
            <label className={labelClass} htmlFor="pf-phone">
              Phone<span className="text-pink"> *</span>
            </label>
            <input id="pf-phone" type="tel" className={fieldClass} value={form.phone} onChange={(e) => set("phone")(e.target.value)} autoComplete="tel" />
          </div>
        </div>

        {error && <p className="font-sans text-[13px] text-[#ff8d8d] m-0 mt-4">{error}</p>}

        <button type="submit" disabled={saving} className={btnSolid + " mt-6"}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
