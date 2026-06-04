"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { signOut } from "next-auth/react";
import type {
  AccountAddress,
  AccountData,
  AccountProfile,
} from "@/lib/queries/account";
import {
  ICONS,
  RETURN_REASONS,
  initials,
  type ReturnRequest,
  type View,
} from "./shared";
import { DashboardView, OrdersView, OrderDetailView } from "./order-views";
import { ReturnsView } from "./returns-view";
import { AddressesView, AddressForm } from "./addresses-view";
import { ProfileView } from "./profile-view";
import { SecurityView } from "./security-view";

const RETURNS_KEY = "sb-acct-returns";

type Modal =
  | { kind: "none" }
  | { kind: "address"; address: AccountAddress | null }
  | { kind: "confirm-delete-address"; address: AccountAddress }
  | { kind: "confirm-delete-account" };

const SIDEBAR: { view: View; label: string; icon: keyof typeof ICONS }[] = [
  { view: "dashboard", label: "Dashboard", icon: "dashboard" },
  { view: "orders", label: "Orders", icon: "orders" },
  { view: "returns", label: "Returns", icon: "returns" },
  { view: "addresses", label: "Addresses", icon: "addresses" },
];
const SIDEBAR_2: { view: View; label: string; icon: keyof typeof ICONS }[] = [
  { view: "profile", label: "Profile", icon: "profile" },
  { view: "security", label: "Security", icon: "security" },
];

const VALID_VIEWS: View[] = [
  "dashboard",
  "orders",
  "returns",
  "addresses",
  "profile",
  "security",
];

export function AccountClient({ initial }: { initial: AccountData }) {
  const [profile, setProfile] = useState<AccountProfile>(initial.profile);
  const [addresses, setAddresses] = useState<AccountAddress[]>(initial.addresses);
  const orders = initial.orders;

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [view, setView] = useState<View>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [returnPrefill, setReturnPrefill] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>({ kind: "none" });
  const [modalBusy, setModalBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // Hydrate returns from sessionStorage; seed two demo requests from real orders
  // on first visit (Returns has no DB model — this is client-state only).
  useEffect(() => {
    const stored = sessionStorage.getItem(RETURNS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ReturnRequest[];
        // Deferred to a microtask to satisfy React 19's no-sync-setState-in-effect rule.
        queueMicrotask(() => setReturns(parsed));
        return;
      } catch {
        /* fall through to seed */
      }
    }
    const seed: ReturnRequest[] = orders.slice(0, 2).map((o, i) => ({
      id: `RT-${2041 - i}`,
      orderId: o.id,
      orderNumber: o.orderNumber,
      product: o.items[0]?.name ?? "Item",
      reason: i === 0 ? "Damaged Item" : "Changed Mind",
      notes: i === 0 ? "The clasp arrived slightly bent." : "",
      status: i === 0 ? "Approved" : "Pending Review",
      date: o.dateLabel,
    }));
    queueMicrotask(() => setReturns(seed));
    sessionStorage.setItem(RETURNS_KEY, JSON.stringify(seed));
  }, [orders]);

  // Deep-link via ?view= (read once on mount; window avoids a Suspense boundary).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("view");
    if (param && (VALID_VIEWS as string[]).includes(param)) {
      queueMicrotask(() => setView(param as View));
    }
  }, []);

  // Smooth-scroll to top whenever the active view changes.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  // Escape closes any open modal.
  useEffect(() => {
    if (modal.kind === "none") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal({ kind: "none" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal.kind]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const persistReturns = useCallback((next: ReturnRequest[]) => {
    setReturns(next);
    sessionStorage.setItem(RETURNS_KEY, JSON.stringify(next));
  }, []);

  const goto = useCallback((v: View) => setView(v), []);

  const openOrder = useCallback((id: string) => {
    setSelectedOrderId(id);
    setView("order-detail");
  }, []);

  const startReturn = useCallback((orderId: string) => {
    setReturnPrefill(orderId);
    setView("returns");
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const eligibleOrders = useMemo(
    () => orders.filter((o) => o.returnEligible),
    [orders],
  );

  const inProgressCount = orders.filter(
    (o) => o.status === "Processing" || o.status === "Shipped",
  ).length;
  const completedCount = orders.filter((o) => o.status === "Delivered").length;

  // --- Profile -------------------------------------------------------------
  const saveProfile = useCallback(
    async (data: { firstName: string; lastName: string; email: string; phone: string }) => {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        profile?: Omit<AccountProfile, "memberSince" | "tier">;
      };
      if (!res.ok || !body.profile) {
        showToast(body.error ?? "Couldn't save your profile");
        return false;
      }
      setProfile((p) => ({ ...p, ...body.profile! }));
      showToast("Profile saved ✦");
      return true;
    },
    [showToast],
  );

  // --- Password ------------------------------------------------------------
  const changePassword = useCallback(
    async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(body.error ?? "Couldn't update your password");
        return false;
      }
      showToast("Password updated ✦");
      return true;
    },
    [showToast],
  );

  // --- Addresses -----------------------------------------------------------
  const saveAddress = useCallback(
    async (data: Record<string, unknown>, id: string | null) => {
      setModalBusy(true);
      const res = await fetch("/api/account/addresses", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { ...data, id } : data),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        addresses?: AccountAddress[];
      };
      setModalBusy(false);
      if (!res.ok || !body.addresses) {
        showToast(body.error ?? "Couldn't save that address");
        return;
      }
      setAddresses(body.addresses);
      setModal({ kind: "none" });
      showToast(id ? "Address updated ✦" : "Address added ✦");
    },
    [showToast],
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      const res = await fetch("/api/account/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, makeDefault: true }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        addresses?: AccountAddress[];
      };
      if (!res.ok || !body.addresses) {
        showToast(body.error ?? "Couldn't update default");
        return;
      }
      setAddresses(body.addresses);
      showToast("Default address updated ✦");
    },
    [showToast],
  );

  const confirmDeleteAddress = useCallback(
    async (id: string) => {
      setModalBusy(true);
      const res = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        addresses?: AccountAddress[];
      };
      setModalBusy(false);
      if (!res.ok || !body.addresses) {
        showToast(body.error ?? "Couldn't delete that address");
        return;
      }
      setAddresses(body.addresses);
      setModal({ kind: "none" });
      showToast("Address removed");
    },
    [showToast],
  );

  // --- Returns -------------------------------------------------------------
  const submitReturn = useCallback(
    (data: { orderId: string; product: string; reason: string; notes: string }) => {
      const order = orders.find((o) => o.id === data.orderId);
      const next: ReturnRequest = {
        id: `RT-${Math.floor(1000 + Math.random() * 9000)}`,
        orderId: data.orderId,
        orderNumber: order?.orderNumber ?? data.orderId,
        product: data.product,
        reason: data.reason,
        notes: data.notes,
        status: "Pending Review",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
      persistReturns([next, ...returns]);
      setReturnPrefill(null);
      showToast("Return request submitted ✦");
    },
    [orders, returns, persistReturns, showToast],
  );

  // --- Delete account ------------------------------------------------------
  const deleteAccount = useCallback(() => {
    setModal({ kind: "none" });
    showToast("Account scheduled for deletion — redirecting…");
    setTimeout(() => {
      window.location.href = "/";
    }, 1800);
  }, [showToast]);

  const sidebarActive: View = view === "order-detail" ? "orders" : view;

  return (
    <main className="pt-[110px] pb-[100px] max-[900px]:pt-[100px] max-[900px]:pb-20 px-[8%] max-[900px]:px-[6%]">
      {/* Header */}
      <header className="mb-9">
        <p className="font-sans text-[11px] font-medium tracking-[0.24em] uppercase text-pink m-0">
          My Account
        </p>
        <h1 className="font-display text-[clamp(40px,5.5vw,60px)] leading-[1.04] tracking-[-0.01em] text-ink m-0 mt-2">
          Hello,{" "}
          <em className="font-serif italic text-blush font-medium">
            {profile.firstName}
          </em>
          .
        </h1>
      </header>

      <div className="grid grid-cols-[260px_1fr] gap-9 items-start max-[900px]:grid-cols-1 max-[900px]:gap-6">
        {/* Sidebar */}
        <aside className="sticky top-[100px] max-[900px]:static">
          <div
            className={
              "rounded-[18px] border border-white/[0.06] bg-card p-3 " +
              "light:border-[rgba(26,13,18,0.08)] " +
              "max-[900px]:flex max-[900px]:gap-2 max-[900px]:overflow-x-auto max-[900px]:p-2"
            }
          >
            {/* Mini profile */}
            <div className="flex items-center gap-3 p-3 mb-2 max-[900px]:hidden">
              <span
                aria-hidden="true"
                className="flex-none w-11 h-11 rounded-full grid place-items-center font-serif text-[15px] font-semibold text-white bg-gradient-to-br from-pink to-pink-deep"
              >
                {initials(profile.firstName, profile.lastName)}
              </span>
              <div className="min-w-0">
                <p className="font-sans text-[14px] font-semibold text-ink m-0 truncate">
                  {profile.name || profile.firstName}
                </p>
                <p className="font-sans text-[11px] tracking-[0.1em] text-gold-soft m-0 mt-0.5">
                  ★ {profile.tier}
                </p>
              </div>
            </div>

            <nav className="flex flex-col gap-1 max-[900px]:flex-row max-[900px]:gap-2">
              {SIDEBAR.map((item) => (
                <SideLink
                  key={item.view}
                  active={sidebarActive === item.view}
                  onClick={() => goto(item.view)}
                  icon={ICONS[item.icon]}
                  label={item.label}
                  badge={
                    item.view === "orders"
                      ? orders.length
                      : item.view === "returns"
                        ? returns.length
                        : undefined
                  }
                />
              ))}

              <span className="my-2 h-px bg-white/[0.06] light:bg-[rgba(26,13,18,0.08)] max-[900px]:hidden" />

              {SIDEBAR_2.map((item) => (
                <SideLink
                  key={item.view}
                  active={sidebarActive === item.view}
                  onClick={() => goto(item.view)}
                  icon={ICONS[item.icon]}
                  label={item.label}
                />
              ))}

              <span className="my-2 h-px bg-white/[0.06] light:bg-[rgba(26,13,18,0.08)] max-[900px]:hidden" />

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className={
                  "group flex items-center gap-3 py-2.5 px-3 rounded-xl border-0 bg-transparent cursor-pointer text-left " +
                  "font-sans text-[13px] font-medium text-ink-faint whitespace-nowrap " +
                  "transition-[color,background-color] duration-200 " +
                  "hover:text-[#ff8d8d] hover:bg-[rgba(255,141,141,0.08)] [&_svg]:w-[18px] [&_svg]:h-[18px]"
                }
              >
                {ICONS.signout}
                Sign out
              </button>
            </nav>
          </div>
        </aside>

        {/* Content panel */}
        <section key={view} className="min-w-0 animate-[fadeIn_0.32s_ease]">
          {view === "dashboard" && (
            <DashboardView
              orders={orders}
              totalOrders={orders.length}
              inProgress={inProgressCount}
              completed={completedCount}
              onGoto={goto}
              onOpenOrder={openOrder}
            />
          )}
          {view === "orders" && (
            <OrdersView orders={orders} onOpenOrder={openOrder} onTrack={openOrder} />
          )}
          {view === "order-detail" && (
            <OrderDetailView
              order={selectedOrder}
              shipTo={addresses.find((a) => a.isDefault) ?? addresses[0] ?? null}
              onBack={() => goto("orders")}
              onStartReturn={startReturn}
            />
          )}
          {view === "returns" && (
            <ReturnsView
              eligibleOrders={eligibleOrders}
              reasons={[...RETURN_REASONS]}
              returns={returns}
              prefillOrderId={returnPrefill}
              onSubmit={submitReturn}
            />
          )}
          {view === "addresses" && (
            <AddressesView
              addresses={addresses}
              onAdd={() => setModal({ kind: "address", address: null })}
              onEdit={(a) => setModal({ kind: "address", address: a })}
              onSetDefault={setDefaultAddress}
              onDelete={(a) => setModal({ kind: "confirm-delete-address", address: a })}
            />
          )}
          {view === "profile" && (
            <ProfileView profile={profile} onSave={saveProfile} />
          )}
          {view === "security" && (
            <SecurityView
              onChangePassword={changePassword}
              onDeleteAccount={() => setModal({ kind: "confirm-delete-account" })}
            />
          )}
        </section>
      </div>

      {/* Modal */}
      {modal.kind !== "none" && (
        <ModalScrim onClose={() => setModal({ kind: "none" })}>
          {modal.kind === "address" && (
            <AddressForm
              address={modal.address}
              busy={modalBusy}
              onCancel={() => setModal({ kind: "none" })}
              onSubmit={(data) => saveAddress(data, modal.address?.id ?? null)}
            />
          )}
          {modal.kind === "confirm-delete-address" && (
            <ConfirmDeleteAddress
              address={modal.address}
              busy={modalBusy}
              onCancel={() => setModal({ kind: "none" })}
              onConfirm={() => confirmDeleteAddress(modal.address.id)}
            />
          )}
          {modal.kind === "confirm-delete-account" && (
            <ConfirmDeleteAccount
              onCancel={() => setModal({ kind: "none" })}
              onConfirm={deleteAccount}
            />
          )}
        </ModalScrim>
      )}

      {/* Toast */}
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

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </main>
  );
}

function SideLink({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        "flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer text-left whitespace-nowrap " +
        "font-sans text-[13px] font-medium transition-[color,background-color,border-color] duration-200 " +
        "[&_svg]:w-[18px] [&_svg]:h-[18px] border " +
        (active
          ? "text-blush border-pink/30 bg-[linear-gradient(120deg,rgba(255,79,163,0.16),rgba(255,79,163,0.04))]"
          : "text-ink-dim border-transparent hover:text-ink hover:bg-white/[0.04] light:hover:bg-[rgba(26,13,18,0.04)]")
      }
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={
            "flex-none min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full " +
            "font-sans text-[10px] font-bold " +
            (active
              ? "bg-pink text-white"
              : "bg-white/[0.08] text-ink-faint light:bg-[rgba(26,13,18,0.08)]")
          }
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function ModalScrim({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] grid place-items-center p-6 bg-black/60 backdrop-blur-[6px] animate-[fadeIn_0.2s_ease]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className={
          "w-full max-w-[520px] max-h-[88vh] overflow-y-auto rounded-[22px] border border-line-pink " +
          "bg-canvas-elev p-7 shadow-[0_30px_80px_rgba(0,0,0,0.6)] " +
          "animate-[modalIn_0.26s_cubic-bezier(0.22,1,0.36,1)] light:bg-card"
        }
      >
        {children}
        <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      </div>
    </div>
  );
}

function ConfirmDeleteAddress({
  address,
  busy,
  onCancel,
  onConfirm,
}: {
  address: AccountAddress;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-[26px] text-ink m-0 mb-2">Delete address?</h2>
      <p className="font-sans text-[14px] leading-[1.6] text-ink-dim m-0 mb-6">
        {address.fullName} — {address.line1}, {address.city}. This can&apos;t be
        undone.
      </p>
      <div className="flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="py-2.5 px-5 rounded-full border border-white/14 bg-transparent text-ink-dim font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer hover:text-ink hover:border-blush transition-colors light:border-[rgba(26,13,18,0.14)]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="py-2.5 px-5 rounded-full border-0 bg-[#c0392b] text-white font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer hover:bg-[#d6453a] transition-colors disabled:opacity-60"
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

function ConfirmDeleteAccount({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [pwd, setPwd] = useState("");
  return (
    <div>
      <div className="mb-5 p-4 rounded-xl border border-[rgba(192,57,43,0.4)] bg-[rgba(192,57,43,0.12)]">
        <p className="font-sans text-[13px] font-semibold text-[#ff8d8d] m-0">
          ⚠ This is permanent
        </p>
        <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mt-1.5">
          Your profile and saved addresses will be removed. Past orders are
          retained in anonymized form for our records.
        </p>
      </div>
      <h2 className="font-display text-[24px] text-ink m-0 mb-2">
        Delete your account
      </h2>
      <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mb-4">
        Enter your password to confirm.
      </p>
      <input
        type="password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        className="w-full h-12 px-4 mb-6 rounded-xl border border-white/12 bg-white/[0.03] font-sans text-[15px] text-ink placeholder:text-ink-faint outline-none focus:border-pink focus:bg-pink/[0.04] light:bg-white light:border-[rgba(26,13,18,0.12)]"
      />
      <div className="flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="py-2.5 px-5 rounded-full border border-white/14 bg-transparent text-ink-dim font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer hover:text-ink hover:border-blush transition-colors light:border-[rgba(26,13,18,0.14)]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!pwd}
          onClick={onConfirm}
          className="py-2.5 px-5 rounded-full border-0 bg-[#c0392b] text-white font-sans text-[12px] font-bold tracking-[0.12em] uppercase cursor-pointer hover:bg-[#d6453a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
