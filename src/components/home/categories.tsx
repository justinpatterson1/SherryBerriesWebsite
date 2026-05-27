import Image from "next/image";
import Link from "next/link";
import { getHomeCategories } from "@/lib/queries/home";

const cardClass =
  "group relative block aspect-[3/4] rounded-[22px] overflow-hidden no-underline isolate " +
  "border border-white/[0.06] bg-card " +
  "transition-[transform,border-color,box-shadow] duration-[380ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
  "hover:-translate-y-1.5 hover:border-pink " +
  "hover:shadow-[0_24px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,79,163,0.3)_inset,0_30px_80px_rgba(255,79,163,0.18)] " +
  "after:content-[''] after:absolute after:inset-0 after:z-[1] after:pointer-events-none " +
  "after:bg-[linear-gradient(180deg,transparent_30%,rgba(13,13,13,0.95)_100%)] " +
  "before:content-[''] before:absolute before:-top-[40%] before:-right-[40%] before:w-[80%] before:h-[80%] before:z-[2] before:pointer-events-none " +
  "before:bg-[radial-gradient(circle,rgba(255,79,163,0.5),transparent_65%)] " +
  "before:opacity-0 before:transition-opacity before:duration-[380ms] hover:before:opacity-100";

export async function Categories() {
  const categories = await getHomeCategories();

  return (
    <section
      aria-labelledby="cats-title"
      className="py-[120px] pb-20 px-[8%] relative max-[900px]:px-[6%] max-[900px]:py-20"
    >
      <div className="flex flex-col gap-3.5 mb-14 max-w-[720px] max-[900px]:mb-9">
        <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-pink">
          Shop the collection
        </span>
        <h2
          id="cats-title"
          className="font-display text-[clamp(36px,4vw,56px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
        >
          Find your <span className="font-serif italic text-blush">signature</span>{" "}
          piece.
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-5 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        {categories.map((cat, i) => (
          <Link key={cat.id} href={`/products?category=${cat.slug}`} className={cardClass}>
            <div className="absolute inset-0 z-0">
              {cat.imageUrl && (
                <Image
                  src={cat.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
                />
              )}
            </div>
            <span className="absolute top-[18px] left-5 z-[3] font-serif italic text-base font-semibold tracking-[0.04em] text-pink [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="absolute left-[22px] right-[22px] bottom-[22px] z-[3] flex flex-col gap-1.5">
              <h3 className="font-display text-[26px] leading-[1.1] text-ink m-0">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="font-sans text-[13px] leading-[1.45] text-ink-dim m-0">
                  {cat.description}
                </p>
              )}
              <span
                className={
                  "mt-2.5 inline-flex items-center gap-2 font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blush " +
                  "transition-[gap,color] duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
                  "group-hover:gap-4 group-hover:text-pink"
                }
              >
                Shop now{" "}
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
