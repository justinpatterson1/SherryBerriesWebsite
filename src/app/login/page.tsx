"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Mode = "login" | "signup";

const COPY: Record<Mode, { title: ReactNode; sub: ReactNode; foot: ReactNode }> = {
  login: {
    title: (
      <>
        Welcome back,
        <br />
        <em className="font-serif italic text-pink font-medium">sweet berry</em>.
      </>
    ),
    sub: (
      <>
        Sign in to track orders, sync your wishlist, and unlock{" "}
        <strong className="text-ink font-semibold">Berry List</strong> exclusives.
      </>
    ),
    foot: <>New to SherryBerries? </>,
  },
  signup: {
    title: (
      <>
        Become a
        <br />
        <em className="font-serif italic text-pink font-medium">sweet berry</em>.
      </>
    ),
    sub: (
      <>
        Join 12,400+ berries — get 10% off your first order, early drops, and free
        aftercare with every piece.
      </>
    ),
    foot: <>Already have an account? </>,
  },
};

const STRENGTH_COPY = [
  "Use 8+ characters with letters, numbers & a symbol.",
  "Getting started — try a longer mix.",
  "Decent — add a number or symbol for extra glow.",
  "Strong — one more touch unlocks elite.",
  "Sparkling secure. Sherry-approved ✦",
];

function scoreStrength(pwd: string): number {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

const inputClass =
  "peer w-full pt-[22px] pb-2.5 px-4 bg-white/[0.03] border border-white/10 rounded-xl " +
  "text-ink font-sans text-[15px] outline-none placeholder:text-transparent " +
  "transition-[border-color,background-color] duration-200 " +
  "focus:border-pink focus:bg-pink/[0.04] " +
  "light:bg-[rgba(26,13,18,0.03)] light:border-[rgba(26,13,18,0.1)]";

const labelClass =
  "absolute left-4 top-1.5 text-[11px] text-pink tracking-[0.12em] uppercase pointer-events-none " +
  "transition-[top,font-size,color,letter-spacing,text-transform] duration-[180ms] " +
  "peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ink-faint " +
  "peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal " +
  "peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-pink peer-focus:uppercase peer-focus:tracking-[0.12em]";

const eyeClass =
  "absolute right-2 top-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full " +
  "border-0 bg-transparent text-ink-faint cursor-pointer inline-flex items-center justify-center " +
  "transition-[color,background-color] duration-200 hover:text-pink hover:bg-pink/[0.08]";

const submitClass =
  "mt-1.5 py-4 px-6 rounded-full border-0 bg-gradient-to-br from-pink to-pink-deep " +
  "text-white font-sans text-sm font-bold tracking-[0.14em] uppercase cursor-pointer " +
  "shadow-[0_10px_28px_rgba(255,79,163,0.4),0_0_0_1px_rgba(255,255,255,0.1)_inset] " +
  "transition-[transform,box-shadow,opacity] duration-200 " +
  "hover:-translate-y-px hover:shadow-[0_14px_32px_rgba(255,79,163,0.5),0_0_0_1px_rgba(255,255,255,0.16)_inset]";

function strengthBarStyle(strength: number) {
  const widths = ["0%", "25%", "50%", "75%", "100%"];
  const colors = [
    "transparent",
    "#d63a3a",
    "#d6883a",
    "var(--color-gold-soft)",
    "linear-gradient(90deg, var(--color-pink), var(--color-gold-soft))",
  ];
  return {
    width: widths[strength],
    background: colors[strength],
  };
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [signupPwd, setSignupPwd] = useState("");
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [submitState, setSubmitState] = useState<
    Record<Mode, "idle" | "loading" | "success">
  >({ login: "idle", signup: "idle" });

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const strength = scoreStrength(signupPwd);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, formMode: Mode) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector<HTMLInputElement>(":invalid");
      firstInvalid?.focus();
      showToast("Please check your details ✦");
      return;
    }
    setSubmitState((s) => ({ ...s, [formMode]: "loading" }));

    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") || "/";

    if (formMode === "login") {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setSubmitState((s) => ({ ...s, [formMode]: "idle" }));
        showToast(
          result?.code === "rate_limited"
            ? "Too many sign-in attempts. Please try again in a few minutes ♡"
            : "Wrong email or password — or email not yet verified ♡",
        );
        return;
      }
      setSubmitState((s) => ({ ...s, login: "success" }));
      showToast("Welcome back, sweet berry ♡");
      await new Promise((r) => setTimeout(r, 1400));
      window.location.href = callbackUrl;
      return;
    }

    // Sign-up: create the account, then wait for email verification.
    // No auto sign-in — the credentials provider blocks unverified users.
    const firstName = String(data.get("firstName") ?? "").trim();
    const lastName = String(data.get("lastName") ?? "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || firstName;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName,
        email,
        password,
        confirmPassword: password,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setSubmitState((s) => ({ ...s, signup: "idle" }));
      showToast(body.error || "Couldn't create your account ♡");
      return;
    }

    setSubmitState((s) => ({ ...s, signup: "success" }));
    showToast(`Verify your email ✦ — we sent a link to ${email}`);
    await new Promise((r) => setTimeout(r, 1800));
    setMode("login");
    setSubmitState((s) => ({ ...s, signup: "idle" }));
  };

  const submitLabel = (m: Mode) => {
    const state = submitState[m];
    if (state === "loading") return "One moment…";
    if (state === "success") return m === "login" ? "✓ You're in" : "✓ Check your email";
    return m === "login" ? "Sign in" : "Create account";
  };

  return (
    <div className="fixed inset-0 z-[100] grid grid-cols-2 bg-canvas text-ink overflow-hidden isolate max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto">
      <aside
        className={
          "relative overflow-hidden isolate flex flex-col justify-between p-14 " +
          "bg-[radial-gradient(circle_at_30%_30%,rgba(255,79,163,0.32),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(212,175,55,0.2),transparent_65%),linear-gradient(160deg,#2a0f1a_0%,#0d0608_60%,#050304_100%)] " +
          // soft pink glow
          "before:content-[''] before:absolute before:-top-[20%] before:-left-[20%] " +
          "before:w-[700px] before:h-[700px] before:rounded-full before:blur-[80px] before:-z-10 before:pointer-events-none " +
          "before:bg-[radial-gradient(circle,rgba(255,79,163,0.45),transparent_60%)] " +
          "max-[900px]:p-8 max-[900px]:min-h-[280px]"
        }
      >
        <Link
          href="/"
          className="font-display text-[32px] tracking-[0.02em] text-white no-underline leading-none"
        >
          Sherry<span className="font-serif italic text-pink ml-px">Berries</span>
        </Link>

        <div className="max-w-[480px]">
          <div className="font-sans text-xs font-medium tracking-[0.24em] uppercase text-pink mb-[18px]">
            The Berry List
          </div>
          <h1 className="font-display text-[clamp(40px,4.4vw,60px)] leading-[1.05] tracking-[-0.01em] text-white m-0 mb-[22px] max-[900px]:text-[clamp(28px,6vw,36px)] max-[900px]:mb-3.5">
            Luxury body jewelry,{" "}
            <em className="font-serif italic text-blush font-medium">made for your glow</em>.
          </h1>
          <p className="font-serif italic text-lg leading-[1.55] text-ink-dim max-w-[440px] border-l-2 border-pink pl-[18px] max-[900px]:hidden">
            “The aftercare alone changed how I think about piercings — and the gold-fill
            pieces are now half my jewelry box.” — Maya, Brooklyn
          </p>
        </div>

        <div className="flex gap-[22px] font-sans text-[11px] font-medium tracking-[0.2em] uppercase text-ink-faint max-[900px]:gap-3.5 max-[900px]:flex-wrap">
          <span>
            Implant-grade <span className="text-pink">✦</span>
          </span>
          <span>
            Hypoallergenic <span className="text-pink">✦</span>
          </span>
          <span>
            Studio-tested <span className="text-pink">✦</span>
          </span>
        </div>
      </aside>

      <section className="flex items-center justify-center p-10 overflow-y-auto max-[900px]:p-8 max-[900px]:pb-12 max-[900px]:px-[6%]">
        <div className="w-full max-w-[480px] flex flex-col gap-7">
          <Link
            href="/"
            className={
              "font-sans text-xs font-medium tracking-[0.16em] uppercase text-ink-faint no-underline " +
              "inline-flex items-center gap-2 self-start " +
              "transition-[color,gap] duration-200 hover:text-pink hover:gap-3"
            }
          >
            <span aria-hidden="true">←</span> Back to shop
          </Link>

          <div
            role="tablist"
            data-mode={mode}
            className="inline-flex self-start p-[5px] rounded-full bg-white/[0.04] border border-white/[0.08]"
          >
            <TabButton active={mode === "login"} onClick={() => setMode("login")}>
              Sign in
            </TabButton>
            <TabButton active={mode === "signup"} onClick={() => setMode("signup")}>
              Create account
            </TabButton>
          </div>

          <h2 className="font-display text-[clamp(34px,3.6vw,46px)] leading-[1.06] tracking-[-0.01em] text-ink m-0">
            {COPY[mode].title}
          </h2>
          <p className="font-sans text-[15px] leading-[1.6] text-ink-dim -mt-2.5">
            {COPY[mode].sub}
          </p>

          {/* Login form */}
          <form
            onSubmit={(e) => handleSubmit(e, "login")}
            noValidate
            className={mode === "login" ? "flex flex-col gap-4" : "hidden"}
          >
            <div className="relative">
              <input
                id="loginEmail"
                name="email"
                type="email"
                required
                placeholder=" "
                autoComplete="email"
                className={inputClass}
              />
              <label htmlFor="loginEmail" className={labelClass}>
                Email
              </label>
            </div>

            <div className="relative">
              <input
                id="loginPassword"
                name="password"
                type={showLoginPwd ? "text" : "password"}
                required
                placeholder=" "
                autoComplete="current-password"
                className={`${inputClass} pr-12`}
              />
              <label htmlFor="loginPassword" className={labelClass}>
                Password
              </label>
              <button
                type="button"
                aria-label={showLoginPwd ? "Hide password" : "Show password"}
                aria-pressed={showLoginPwd}
                onClick={() => setShowLoginPwd((v) => !v)}
                className={eyeClass}
              >
                {showLoginPwd ? <EyeOff /> : <EyeOn />}
              </button>
            </div>

            <div className="flex items-center justify-between font-sans text-xs text-ink-faint">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="remember" defaultChecked /> Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-blush no-underline transition-colors duration-200 hover:text-pink"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitState.login !== "idle"}
              className={`${submitClass} ${
                submitState.login === "loading" ? "opacity-85 cursor-progress" : ""
              } disabled:opacity-85 disabled:cursor-not-allowed`}
            >
              {submitLabel("login")}
            </button>
          </form>

          {/* Signup form */}
          <form
            onSubmit={(e) => handleSubmit(e, "signup")}
            noValidate
            className={mode === "signup" ? "flex flex-col gap-4" : "hidden"}
          >
            <div className="grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
              <div className="relative">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  placeholder=" "
                  autoComplete="given-name"
                  className={inputClass}
                />
                <label htmlFor="firstName" className={labelClass}>
                  First name
                </label>
              </div>
              <div className="relative">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder=" "
                  autoComplete="family-name"
                  className={inputClass}
                />
                <label htmlFor="lastName" className={labelClass}>
                  Last name
                </label>
              </div>
            </div>

            <div className="relative">
              <input
                id="signupEmail"
                name="email"
                type="email"
                required
                placeholder=" "
                autoComplete="email"
                className={inputClass}
              />
              <label htmlFor="signupEmail" className={labelClass}>
                Email
              </label>
            </div>

            <div className="relative">
              <input
                id="signupPassword"
                name="password"
                type={showSignupPwd ? "text" : "password"}
                required
                minLength={8}
                placeholder=" "
                autoComplete="new-password"
                value={signupPwd}
                onChange={(e) => setSignupPwd(e.target.value)}
                className={`${inputClass} pr-12`}
              />
              <label htmlFor="signupPassword" className={labelClass}>
                Password
              </label>
              <button
                type="button"
                aria-label={showSignupPwd ? "Hide password" : "Show password"}
                aria-pressed={showSignupPwd}
                onClick={() => setShowSignupPwd((v) => !v)}
                className={eyeClass}
              >
                {showSignupPwd ? <EyeOff /> : <EyeOn />}
              </button>
            </div>

            <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden mt-0.5">
              <div
                aria-hidden="true"
                style={strengthBarStyle(strength)}
                className="h-full rounded-full transition-[width,background] duration-[280ms]"
              />
            </div>
            <p
              aria-live="polite"
              className={`font-sans text-xs m-0 mt-0.5 transition-colors duration-200 ${
                strength >= 3 ? "text-blush" : "text-ink-faint"
              }`}
            >
              {STRENGTH_COPY[strength]}
            </p>

            <button
              type="submit"
              disabled={submitState.signup !== "idle"}
              className={`${submitClass} ${
                submitState.signup === "loading" ? "opacity-85 cursor-progress" : ""
              } disabled:opacity-85 disabled:cursor-not-allowed`}
            >
              {submitLabel("signup")}
            </button>
          </form>

          <p className="font-sans text-[13px] text-ink-faint text-center mt-1.5">
            {COPY[mode].foot}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMode(mode === "login" ? "signup" : "login");
              }}
              className="text-blush font-semibold no-underline transition-colors duration-200 hover:text-pink"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </a>
          </p>
        </div>
      </section>

      <div
        role="status"
        aria-live="polite"
        className={
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] py-3.5 px-[22px] rounded-full " +
          "bg-[rgba(15,12,13,0.92)] border border-pink/[0.28] text-white font-sans text-[13px] font-medium tracking-[0.04em] " +
          "backdrop-blur-[20px] shadow-[0_18px_40px_rgba(0,0,0,0.5)] " +
          "transition-[opacity,transform] duration-[240ms] pointer-events-none " +
          (toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5")
        }
      >
        {toast?.msg}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "py-2.5 px-[22px] border-0 rounded-full font-sans text-xs font-semibold tracking-[0.14em] uppercase cursor-pointer " +
        "transition-[background-color,color,box-shadow] duration-[220ms] " +
        (active
          ? "bg-gradient-to-br from-pink to-pink-deep text-white shadow-[0_6px_18px_rgba(255,79,163,0.35)]"
          : "bg-transparent text-ink-faint")
      }
    >
      {children}
    </button>
  );
}

function EyeOn() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 9s2.5-5 8-5 8 5 8 5-2.5 5-8 5S1 9 1 9z" />
      <circle cx="9" cy="9" r="2.5" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 2l14 14" />
      <path d="M6.5 6.5C4 8 1 9 1 9s2.5 5 8 5c1.4 0 2.6-.3 3.7-.7" />
      <path d="M11.5 11.5A2.5 2.5 0 0 1 6.5 6.5" />
      <path d="M9 4c5.5 0 8 5 8 5s-.7 1.4-2.1 2.7" />
    </svg>
  );
}

