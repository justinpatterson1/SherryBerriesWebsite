"use client";

import { useState, type FormEvent } from "react";
import { btnSolid, cardClass } from "./shared";

const fieldClass =
  "w-full h-12 px-3.5 rounded-xl border border-white/12 bg-white/[0.03] " +
  "font-sans text-[14px] text-ink placeholder:text-ink-faint outline-none " +
  "transition-[border-color,background-color] duration-200 focus:border-pink focus:bg-pink/[0.04] " +
  "light:bg-white light:border-[rgba(26,13,18,0.12)]";
const labelClass =
  "block font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-faint mb-1.5";

export function SecurityView({
  onChangePassword,
  onDeleteAccount,
}: {
  onChangePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<boolean>;
  onDeleteAccount: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!current) return setError("Enter your current password.");
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New passwords don't match.");
    setError(null);
    setSaving(true);
    const ok = await onChangePassword({
      currentPassword: current,
      newPassword: next,
      confirmPassword: confirm,
    });
    setSaving(false);
    if (ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[30px] leading-tight text-ink m-0">Security</h2>
        <p className="font-sans text-[13px] text-ink-dim m-0 mt-1.5">
          Keep your account locked down.
        </p>
      </div>

      {/* Change password */}
      <form onSubmit={handleSubmit} className={cardClass + " mb-6"}>
        <h3 className="font-display text-[22px] text-ink m-0 mb-5">Change password</h3>
        <div className="flex flex-col gap-4 max-w-[420px]">
          <div>
            <label className={labelClass} htmlFor="sec-current">Current password</label>
            <input id="sec-current" type="password" className={fieldClass} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div>
            <label className={labelClass} htmlFor="sec-new">New password</label>
            <input id="sec-new" type="password" className={fieldClass} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label className={labelClass} htmlFor="sec-confirm">Confirm new password</label>
            <input id="sec-confirm" type="password" className={fieldClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
        </div>

        {error && <p className="font-sans text-[13px] text-[#ff8d8d] m-0 mt-4">{error}</p>}

        <button type="submit" disabled={saving} className={btnSolid + " mt-6"}>
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>

      {/* Danger zone */}
      <div className="rounded-[18px] border border-[rgba(192,57,43,0.4)] bg-[rgba(192,57,43,0.08)] p-6">
        <h3 className="font-display text-[22px] text-[#ff8d8d] m-0 mb-2">Danger zone</h3>
        <p className="font-sans text-[14px] leading-[1.6] text-ink-dim m-0 mb-5 max-w-[520px]">
          Deleting your account is permanent and cannot be undone. Your profile and
          saved addresses are removed; past orders are retained in anonymized form.
        </p>
        <button
          type="button"
          onClick={onDeleteAccount}
          className="py-3 px-6 rounded-full border border-[rgba(192,57,43,0.5)] bg-transparent text-[#ff8d8d] font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-[#c0392b] hover:text-white hover:border-[#c0392b]"
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
