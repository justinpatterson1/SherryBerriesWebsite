import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listProducts } from "@/lib/queries/product";
import { getHomeCategories } from "@/lib/queries/home";

type PageProps = { searchParams: Promise<{ category?: string }> };

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { category } = await searchParams;
  if (!category) {
    return {
      title: "Shop all products | SherryBerries",
      description:
        "Luxury body jewelry, aftercare, and elixirs from Trinidad & Tobago.",
    };
  }
  const categories = await getHomeCategories();
  const match = categories.find((c) => c.slug === category);
  if (!match) return { title: "Products | SherryBerries" };
  return {
    title: `${match.name} | SherryBerries`,
    description:
      match.description ??
      `Shop ${match.name.toLowerCase()} from the SherryBerries studio.`,
  };
}

export default async function ProductsListingPage({ searchParams }: PageProps) {
  const { category: categorySlug } = await searchParams;

  const [products, categories] = await Promise.all([
    listProducts({ categorySlug }),
    getHomeCategories(),
  ]);

  const active = categories.find((c) => c.slug === categorySlug) ?? null;

  return (
    <main className="pt-[110px] pb-[100px] max-[900px]:pt-[100px] max-[900px]:pb-20">
      <header className="px-[8%] mb-10 max-[900px]:px-[6%] max-[900px]:mb-8">
        <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-pink">
          {active ? "Category" : "All products"}
        </span>
        <h1 className="font-display text-[clamp(40px,5vw,68px)] leading-[1.04] tracking-[-0.01em] text-ink m-0 mt-3">
          {active ? active.name : "Sweet pieces, picked from the studio."}
        </h1>
        {active?.description && (
          <p className="font-serif italic text-[18px] leading-[1.55] text-ink-dim m-0 mt-3 max-w-[640px]">
            {active.description}
          </p>
        )}
      </header>

      <nav
        aria-label="Filter by category"
        className="px-[8%] mb-10 max-[900px]:px-[6%] max-[900px]:mb-8"
      >
        <ul className="flex flex-wrap gap-2">
          <li>
            <CategoryChip href="/products" active={!categorySlug}>
              All
            </CategoryChip>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <CategoryChip
                href={`/products?category=${cat.slug}`}
                active={cat.slug === categorySlug}
              >
                {cat.name}
              </CategoryChip>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-[8%] mb-6 font-sans text-[11px] tracking-[0.16em] uppercase text-ink-faint max-[900px]:px-[6%]">
        {products.length} {products.length === 1 ? "piece" : "pieces"}
      </div>

      {products.length === 0 ? (
        <div className="px-[8%] max-[900px]:px-[6%]">
          <div className="p-10 rounded-[20px] border border-white/[0.06] bg-card text-center">
            <p className="font-serif italic text-[18px] text-ink-dim m-0">
              Nothing here yet — try another category.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={
            "px-[8%] grid grid-cols-4 gap-[22px] " +
            "max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[900px]:px-[6%] max-[520px]:grid-cols-1"
          }
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}

function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center py-2.5 px-4 rounded-full border " +
        "font-sans text-xs font-semibold tracking-[0.12em] uppercase no-underline " +
        "transition-[background-color,color,border-color,transform,box-shadow] duration-200 " +
        (active
          ? "bg-ink text-canvas border-ink shadow-[0_6px_16px_rgba(255,79,163,0.18)] -translate-y-px"
          : "border-white/12 text-ink-dim hover:border-blush hover:text-ink")
      }
    >
      {children}
    </Link>
  );
}

function ProductCard({
  product,
}: {
  product: Awaited<ReturnType<typeof listProducts>>[number];
}) {
  const full = Math.round(product.rating);
  const out = product.inventory <= 0;
  return (
    <Link
      href={`/products/${product.slug}`}
      className={
        "group relative rounded-[18px] bg-card border border-white/[0.06] overflow-hidden no-underline " +
        "transition-[transform,border-color,box-shadow] duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] " +
        "hover:-translate-y-1 hover:border-pink " +
        "hover:shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,79,163,0.2)_inset,0_24px_60px_rgba(255,79,163,0.18)]"
      }
    >
      <div className="relative aspect-square overflow-hidden bg-canvas-2">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-pink to-pink-deep transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
          />
        )}

        {product.featured && (
          <span className="absolute top-3.5 left-3.5 z-[2] py-[5px] px-[11px] rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase leading-none shadow-[0_6px_14px_rgba(255,79,163,0.35)]">
            Featured
          </span>
        )}

        {out && (
          <span className="absolute top-3.5 right-3.5 z-[2] py-[5px] px-[11px] rounded-full bg-[rgba(11,9,10,0.85)] backdrop-blur-[6px] text-ink font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase leading-none border border-white/15">
            Sold out
          </span>
        )}
      </div>

      <div className="p-4 pb-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 font-sans text-[11px] text-ink-faint">
          <span
            aria-label={`${product.rating.toFixed(1)} out of 5 stars`}
            className="text-gold tracking-[1px] text-[13px] leading-none"
          >
            {"★".repeat(full)}
            {"☆".repeat(Math.max(0, 5 - full))}
          </span>
          {product.reviewCount > 0 && (
            <span>
              {product.rating.toFixed(1)} · {product.reviewCount}
            </span>
          )}
        </div>

        <span className="font-serif text-lg leading-[1.25] text-ink">
          {product.name}
        </span>

        <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-ink-faint">
          {product.categoryName}
        </span>

        <div className="flex items-baseline gap-2.5 mt-1">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="font-sans text-[13px] text-ink-faint line-through">
              ${product.compareAtPrice.toFixed(2)}
            </span>
          )}
          <span className="font-serif text-[19px] font-semibold text-ink">
            ${product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
}
