"use client";

import { useState, type FormEvent } from "react";

const PERKS = [
  "10% off your first order",
  "Early access drops",
  "Free aftercare guide",
];

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || status !== "idle") return;
    setStatus("submitting");
    // TODO: wire to real subscribe action
    await new Promise((r) => setTimeout(r, 600));
    setStatus("done");
  };

  return (
    <section
      aria-labelledby="berry-title"
      className={
        "relative isolate py-[100px] px-[8%] flex justify-center overflow-hidden " +
        "before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 " +
        "before:w-[800px] before:h-[800px] before:rounded-full before:blur-[80px] before:-z-10 before:pointer-events-none " +
        "before:bg-[radial-gradient(circle,rgba(255,79,163,0.35),transparent_60%)] " +
        "max-[640px]:py-20 max-[640px]:px-[6%]"
      }
    >
      <div
        className={
          "w-full max-w-[960px] py-[84px] px-16 rounded-[32px] " +
          "bg-white/[0.03] border border-pink/[0.28] backdrop-blur-[20px] backdrop-saturate-150 " +
          "shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset,0_30px_100px_rgba(255,79,163,0.18)] " +
          "flex flex-col items-center text-center " +
          "light:bg-white/55 light:shadow-[0_30px_80px_rgba(180,120,140,0.25),0_0_0_1px_rgba(255,255,255,0.6)_inset] " +
          "max-[640px]:py-12 max-[640px]:px-6"
        }
      >
        <span className="font-sans text-sm font-medium tracking-[0.24em] uppercase text-pink mb-[22px]">
          The Berry List
        </span>
        <h2
          id="berry-title"
          className="font-display text-[clamp(40px,5vw,52px)] sm:text-[clamp(48px,6vw,68px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
        >
          Join the <span className="font-serif italic text-pink">Berry List</span>.
        </h2>
        <p className="font-sans text-lg leading-[1.6] text-ink-dim mt-[22px] mb-10 max-w-[620px]">
          Soft drops, healing tips, and members-only discounts — straight to your inbox,
          never too often.
        </p>

        {status === "done" ? (
          <p className="font-serif italic text-lg text-blush mt-[18px]">
            You&apos;re on the list, sweet berry. Check your inbox.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className={
              "flex items-center w-full max-w-[620px] p-2 rounded-full " +
              "bg-[rgba(13,13,13,0.4)] border border-white/10 " +
              "transition-[border-color,background-color] duration-[220ms] " +
              "focus-within:border-pink " +
              "light:bg-white/60 light:border-[rgba(26,13,18,0.12)] " +
              "max-[640px]:flex-col max-[640px]:gap-2 max-[640px]:bg-transparent max-[640px]:border-0 max-[640px]:p-0"
            }
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              className={
                "flex-1 min-w-0 py-4 px-[22px] bg-transparent border-0 outline-none " +
                "text-ink font-sans text-[17px] placeholder:text-ink-faint " +
                "max-[640px]:w-full max-[640px]:py-[14px] max-[640px]:px-[18px] max-[640px]:bg-[rgba(13,13,13,0.5)] max-[640px]:border max-[640px]:border-white/10 max-[640px]:rounded-full"
              }
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              className={
                "inline-flex items-center gap-2.5 py-4 px-7 rounded-full " +
                "bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[15px] font-bold tracking-[0.12em] uppercase " +
                "border-0 cursor-pointer whitespace-nowrap " +
                "shadow-[0_8px_22px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
                "transition-[transform,box-shadow,gap] duration-200 " +
                "hover:-translate-y-px hover:gap-3 hover:shadow-[0_12px_28px_rgba(255,79,163,0.5),0_0_0_1px_rgba(255,255,255,0.16)_inset] " +
                "disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none " +
                "max-[640px]:w-full max-[640px]:justify-center max-[640px]:py-[14px]"
              }
            >
              {status === "submitting" ? "Joining…" : "Join now"}{" "}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        )}

        <div className="flex items-center flex-wrap justify-center gap-4 mt-9 font-sans text-xs font-medium tracking-[0.18em] uppercase text-ink-faint">
          {PERKS.map((perk, i) => (
            <span key={perk} className="inline-flex items-center gap-[14px]">
              {perk}
              {i < PERKS.length - 1 && (
                <span className="text-pink text-sm" aria-hidden="true">✦</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
