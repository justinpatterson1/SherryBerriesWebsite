"use client";

import { useState } from "react";
import { validateNewsletterEmail, type NewsletterSource } from "@/lib/newsletter/validate";

export type SignupStatus = "idle" | "submitting" | "done";

/**
 * Submit an address to /api/newsletter. Shared by the homepage section and the
 * popups, so the validation and error messages cannot drift apart.
 */
export function useNewsletterSignup(source: NewsletterSource, popupId?: string) {
  const [status, setStatus] = useState<SignupStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);

  const submit = async (email: string) => {
    if (status !== "idle") return;

    // Validated here for a fast, in-place message; the API validates again,
    // since nothing stops a request arriving without going through this form.
    const check = validateNewsletterEmail(email);
    if (!check.ok) return setError(check.error);

    setError(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: check.email, source, popupId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error);
      setPromoCode(typeof json.promoCode === "string" ? json.promoCode : null);
      setStatus("done");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't sign you up just now. Please try again.",
      );
      setStatus("idle");
    }
  };

  return { status, error, promoCode, submit };
}
