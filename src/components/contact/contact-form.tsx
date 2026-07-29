"use client";

import Link from "next/link";
import { useState } from "react";
import { validateContact } from "@/lib/contact/validate";

type Status = "idle" | "sending" | "sent" | "error";

const fieldClass =
  "w-full h-12 px-4 rounded-xl border border-line bg-canvas-2 font-sans text-[15px] text-ink " +
  "placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink " +
  "light:bg-white";
const labelClass =
  "block font-sans text-[12px] font-bold tracking-[0.1em] uppercase text-ink-faint mb-2";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const sending = status === "sending";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const check = validateContact({ name, email, subject, message });
    if (!check.ok) {
      setError(check.error);
      setStatus("error");
      return;
    }

    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(check.data),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-8">
        <span className="grid place-items-center w-16 h-16 rounded-full bg-gradient-to-br from-pink to-pink-deep text-white text-[30px] shadow-[0_10px_28px_rgba(255,79,163,0.4)]">
          ✓
        </span>
        <h2 className="font-display text-[30px] text-ink m-0">Message sent!</h2>
        <p className="font-sans text-[16px] leading-[1.6] text-ink-dim m-0 max-w-[400px]">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""} — we&apos;ve got your note and will get back
          to you within 1–2 business days.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => {
              setName("");
              setEmail("");
              setSubject("");
              setMessage("");
              setError(null);
              setStatus("idle");
            }}
            className="inline-flex items-center py-3 px-6 rounded-full border border-line bg-canvas-2 font-sans text-[13px] font-bold tracking-[0.12em] uppercase text-ink-dim cursor-pointer transition-colors hover:text-ink hover:border-blush light:bg-white"
          >
            Send another
          </button>
          <Link
            href="/products"
            className="inline-flex items-center py-3 px-6 rounded-full bg-blush text-[#1a0d12] font-sans text-[13px] font-bold tracking-[0.12em] uppercase no-underline transition-transform hover:-translate-y-0.5"
          >
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={labelClass}>
          Subject <span className="text-ink-faint font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="What's this about?"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Tell us how we can help…"
          className="w-full px-4 py-3 rounded-xl border border-line bg-canvas-2 font-sans text-[15px] leading-[1.6] text-ink placeholder:text-ink-faint outline-none transition-[border-color] duration-200 focus:border-pink resize-y light:bg-white"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[rgba(255,141,141,0.3)] bg-[rgba(255,141,141,0.1)] px-4 py-2.5 font-sans text-[13px] text-[#ff8d8d] m-0"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center justify-center gap-2.5 py-4 px-8 rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[14px] font-bold tracking-[0.14em] uppercase border-0 cursor-pointer shadow-[0_10px_24px_rgba(255,79,163,0.34)] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
