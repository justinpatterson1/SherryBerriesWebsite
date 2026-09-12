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
  hasPassword,
}: {
  onChangePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<boolean>;
  onDeleteAccount: (data: {
    password?: string;
    confirmEmail?: string;
  }) => Promise<string | null>;
  hasPassword: boolean;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [reauth, setReauth] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // The typed word is checked here only to keep the button disabled; the
    // server does the re-authentication that actually protects the account.
    if (typed !== "DELETE") return setDeleteError('Type DELETE to confirm.');
    if (!reauth) {
      return setDeleteError(
        hasPassword ? "Enter your password." : "Enter your account email.",
      );
    }
    setDeleteError(null);
    setDeleting(true);
    const err = await onDeleteAccount(
      hasPassword ? { password: reauth } : { confirmEmail: reauth },
    );
    // On success the caller signs out and navigates away, so there is no state
    // to reset — only a failure lands back here.
    if (err) {
      setDeleting(false);
      setDeleteError(err);
    }
  };

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

      {/* Account deletion. This used to be a toast that deleted nothing, then a
          contact link while the endpoint did not exist; it now calls the real
          one. The confirmation is deliberately two-step and typed — this is the
          only irreversible action a customer can take on the site. */}
      <div className="rounded-[18px] border border-[rgba(192,57,43,0.4)] bg-[rgba(192,57,43,0.08)] p-6">
        <h3 className="font-display text-[22px] text-[#ff8d8d] m-0 mb-2">Delete your account</h3>

        {/* Say exactly what survives. "Anonymized" is vague, and a customer
            agreeing to this deserves to know the orders remain. */}
        <p className="font-sans text-[14px] leading-[1.6] text-ink-dim m-0 mb-3 max-w-[520px]">
          This is permanent and cannot be undone. We delete your profile, saved
          addresses, wishlist and bag, and sign you out everywhere.
        </p>
        <p className="font-sans text-[13px] leading-[1.6] text-ink-faint m-0 mb-5 max-w-[520px]">
          Past orders are kept as financial records, with your name, contact
          details and street address stripped from them. You will not be able to
          sign in again or see your order history.
        </p>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center min-h-[44px] py-3 px-6 rounded-full border border-[rgba(192,57,43,0.5)] bg-transparent text-[#ff8d8d] font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-[#c0392b] hover:text-white hover:border-[#c0392b]"
          >
            Delete my account
          </button>
        ) : (
          <form onSubmit={handleDelete} className="max-w-[420px]">
            <div className="mb-4">
              <label className={labelClass} htmlFor="del-confirm">
                Type <span className="text-[#ff8d8d]">DELETE</span> to confirm
              </label>
              <input
                id="del-confirm"
                className={fieldClass}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                placeholder="DELETE"
              />
            </div>

            {/* An OAuth-only account has no password to check against, so it
                re-authenticates by typing its own email instead. */}
            <div className="mb-4">
              <label className={labelClass} htmlFor="del-auth">
                {hasPassword ? "Your password" : "Your account email"}
              </label>
              <input
                id="del-auth"
                type={hasPassword ? "password" : "email"}
                className={fieldClass}
                value={reauth}
                onChange={(e) => setReauth(e.target.value)}
                autoComplete={hasPassword ? "current-password" : "email"}
              />
            </div>

            {deleteError && (
              <p className="font-sans text-[13px] text-[#ff8d8d] m-0 mb-4">{deleteError}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={deleting || typed !== "DELETE"}
                className="inline-flex items-center min-h-[44px] py-3 px-6 rounded-full border border-[#c0392b] bg-[#c0392b] text-white font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setConfirming(false);
                  setTyped("");
                  setReauth("");
                  setDeleteError(null);
                }}
                className="inline-flex items-center min-h-[44px] py-3 px-6 rounded-full border border-white/14 bg-transparent text-ink font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-white/[0.06] light:border-[rgba(26,13,18,0.14)]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
