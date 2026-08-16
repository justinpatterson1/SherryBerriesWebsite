import Link from "next/link";
import type { AccountOrder } from "@/lib/queries/account";
import { cardClass } from "./shared";

// This used to be a working-looking return-request form. It wasn't: there is no
// ReturnRequest model, so submissions were written to sessionStorage, reached
// nobody, and vanished with the tab — while the view also seeded two fabricated
// requests against the customer's real orders on first visit.
//
// The published Returns Policy tells customers to start a return here, so until
// the request flow is backed by the database this points them at a human. Any
// change here should stay consistent with /help/returns.
//
// The per-item hygiene note matters: the Terms and the Returns Policy both say
// pierced jewelry and aftercare cannot come back once unsealed, and this view
// used to list every delivered order under "Orders you can return" with no hint
// of that. It is a heads-up, not a gate — a human still decides at /contact,
// and a damaged or incorrect item is always covered.

export function ReturnsView({ eligibleOrders }: { eligibleOrders: AccountOrder[] }) {
  return (
    <div className="flex flex-col gap-5">
      <div className={cardClass}>
        <h3 className="font-display text-[22px] text-ink m-0 mb-3">
          Request a return or exchange
        </h3>
        <p className="font-sans text-[14px] leading-[1.65] text-ink-dim m-0 mb-4 max-w-[560px]">
          Message us and we&apos;ll take it from there. So we can help quickly, please
          include:
        </p>
        <ul className="m-0 mb-5 p-0 list-none flex flex-col gap-2 max-w-[560px]">
          {[
            "Your order number.",
            "Which item you'd like to return.",
            "The reason — damaged, defective, wrong item, or changed your mind.",
            "Photographs, if the item arrived damaged or incorrect.",
          ].map((line) => (
            <li
              key={line}
              className="relative pl-5 font-sans text-[14px] leading-[1.6] text-ink-dim"
            >
              <span
                className="absolute left-0 top-[0.6em] w-1.5 h-1.5 rounded-full bg-pink"
                aria-hidden="true"
              />
              {line}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center min-h-[44px] py-3 px-6 rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[12px] font-bold tracking-[0.12em] uppercase no-underline transition-transform duration-200 hover:-translate-y-px"
          >
            Contact us
          </Link>
          <Link
            href="/help/returns"
            className="inline-flex items-center min-h-[44px] py-3 px-6 rounded-full border border-white/14 bg-transparent text-ink-dim font-sans text-[12px] font-bold tracking-[0.12em] uppercase no-underline transition-colors hover:text-ink hover:border-blush light:border-[rgba(26,13,18,0.14)]"
          >
            Read the returns policy
          </Link>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="font-display text-[22px] text-ink m-0 mb-3">
          Your delivered orders
        </h3>
        {eligibleOrders.length === 0 ? (
          <p className="font-sans text-[14px] text-ink-dim m-0">
            None yet — orders become returnable once they&apos;ve been delivered.
          </p>
        ) : (
          <>
            <p className="font-sans text-[13px] leading-[1.6] text-ink-dim m-0 mb-4 max-w-[560px]">
              For hygiene reasons, jewelry and aftercare can only come back
              sealed in their original packaging.{" "}
              <span className="text-ink">
                Anything that arrived damaged, defective, or incorrect is always
                covered
              </span>{" "}
              — the note beside each item assumes nothing has gone wrong with it.
            </p>
            <div className="flex flex-col">
              {eligibleOrders.map((o, i) => (
                <div
                  key={o.id}
                  className={
                    "py-4 " +
                    (i > 0 ? "border-t border-white/[0.06] light:border-[rgba(26,13,18,0.08)]" : "")
                  }
                >
                  <span className="font-sans text-[14px] font-semibold text-ink">
                    {o.orderNumber}
                  </span>
                  <p className="font-sans text-[12px] text-ink-faint m-0 mt-1">
                    Delivered {o.dateLabel}
                  </p>
                  <ul className="m-0 mt-2 p-0 list-none flex flex-col gap-1.5">
                    {o.items.map((it) => (
                      <li
                        key={it.id}
                        className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-sans text-[12px] text-ink-faint"
                      >
                        <span>{it.name}</span>
                        <span className="rounded-full border border-white/14 py-0.5 px-2 text-[11px] leading-[1.4] text-ink-dim light:border-[rgba(26,13,18,0.14)]">
                          {it.hygieneExcluded
                            ? "Sealed & unopened only"
                            : "Returnable if unused"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
