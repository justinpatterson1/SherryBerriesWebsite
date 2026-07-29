import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact | SherryBerries",
  description:
    "Questions about sizing, aftercare, or an order? Send the SherryBerries studio a message and we'll get back to you.",
};

export default function ContactPage() {
  return (
    <main className="pt-[120px] max-[600px]:pt-[92px]">
      {/* --- Hero --- */}
      <section className="relative px-[8%] pt-6 pb-10 max-[600px]:px-[6%]">
        <div className="hero-glow" aria-hidden="true" />
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 font-sans text-[13px] text-ink-faint m-0 p-0 list-none">
            <li>
              <Link href="/" className="no-underline text-ink-faint hover:text-blush transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink-dim">Contact</li>
          </ol>
        </nav>

        <div className="max-w-[680px] flex flex-col gap-5">
          <span className="font-sans text-[13px] font-medium tracking-[0.22em] uppercase text-pink">
            Get in touch
          </span>
          <h1 className="font-display text-[clamp(42px,5.5vw,72px)] leading-[1.02] tracking-[-0.01em] text-ink m-0">
            Say <span className="font-serif italic">hello</span>.
          </h1>
          <p className="font-sans text-[19px] leading-[1.65] text-ink-dim m-0 max-w-[560px]">
            Questions about sizing, aftercare, or an order on its way? Drop us a note and a real
            person from the studio will get back to you.
          </p>
        </div>
      </section>

      {/* --- Form + aside --- */}
      <section className="px-[8%] pb-24 max-[600px]:px-[6%] max-[600px]:pb-16">
        <div className="grid grid-cols-[1.4fr_0.6fr] gap-12 items-start max-[900px]:grid-cols-1 max-[900px]:gap-10">
          <div className="rounded-[22px] border border-line bg-card p-8 max-[600px]:p-6">
            <ContactForm />
          </div>

          <aside className="flex flex-col gap-8 max-[900px]:flex-row max-[900px]:flex-wrap max-[600px]:flex-col">
            <div>
              <h2 className="font-serif text-[20px] text-ink m-0 mb-2.5">Response time</h2>
              <p className="font-sans text-[15px] leading-[1.6] text-ink-dim m-0">
                We usually reply within 1–2 business days. Order questions? Include your order
                number so we can help faster.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-[20px] text-ink m-0 mb-2.5">Prefer socials?</h2>
              <p className="font-sans text-[15px] leading-[1.6] text-ink-dim m-0">
                Find us on{" "}
                <a
                  href="https://www.instagram.com/sherryberries_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blush no-underline hover:text-pink transition-colors"
                >
                  Instagram
                </a>{" "}
                and{" "}
                <a
                  href="https://www.tiktok.com/@sherrybvanessa?lang=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blush no-underline hover:text-pink transition-colors"
                >
                  TikTok
                </a>{" "}
                — we answer DMs there too.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
