import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/product";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductBuyBox } from "@/components/product/product-buy-box";
import { ProductWishlistButton } from "@/components/product/product-wishlist-button";
import { ProductAccordion } from "@/components/product/product-accordion";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductTrustBadges } from "@/components/product/product-trust-badges";
import { RelatedProducts } from "@/components/product/related-products";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found | SherryBerries" };

  const title = product.seoTitle ?? `${product.name} | SherryBerries`;
  const description = product.seoDescription ?? product.shortDescription;
  const image = product.images[0]?.imageUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

const JEWELRY_TYPE_LABEL: Record<string, string> = {
  BELLY_RING: "Belly rings",
  NOSE_RING: "Nose rings",
  SEPTUM: "Septum",
  CARTILAGE: "Cartilage",
  NIPPLE: "Nipple",
  EAR_LOBE: "Ear lobe",
  INDUSTRIAL: "Industrial",
  LABRET: "Labret",
  AFTERCARE: "Aftercare",
  ELIXIR: "Elixirs",
};

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  const related = await getRelatedProducts({
    currentProductId: product.id,
    categoryId: product.categoryId,
    jewelryType: product.jewelryType,
  });

  const isBestseller = product.tags.includes("Bestseller");
  const jewelryLabel =
    JEWELRY_TYPE_LABEL[product.jewelryType] ?? product.jewelryType;

  return (
    <main className="pt-[110px] pb-20 max-[900px]:pt-[100px]">
      <nav
        aria-label="Breadcrumb"
        className="px-[8%] mb-6 font-sans text-[11px] tracking-[0.16em] uppercase text-ink-faint max-[900px]:px-[6%]"
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-pink transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-pink transition-colors"
            >
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span className="text-ink-dim">{jewelryLabel}</span>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span className="text-ink">{product.name}</span>
          </li>
        </ol>
      </nav>

      <section
        aria-labelledby="product-title"
        className={
          "grid grid-cols-[1.15fr_1fr] items-start gap-12 px-[8%] " +
          "max-[1100px]:gap-8 max-[900px]:grid-cols-1 max-[900px]:px-[6%]"
        }
      >
        <ProductGallery
          images={product.images}
          productName={product.name}
          bestseller={isBestseller}
        />

        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-pink">
              {product.category.name}
            </span>
            <h1
              id="product-title"
              className="font-display text-[clamp(36px,4.4vw,52px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
            >
              {product.name}
            </h1>
            <p className="font-serif italic text-[17px] leading-[1.55] text-ink-dim m-0">
              {product.shortDescription}
            </p>
          </div>

          <ProductBuyBox
            productId={product.id}
            productName={product.name}
            basePrice={product.price}
            compareAtPrice={product.compareAtPrice}
            variants={product.variants}
            inventory={product.inventory}
            lowStockThreshold={product.lowStockThreshold}
          />

          <div className="flex items-center gap-3 flex-wrap">
            <ProductWishlistButton
              productId={product.id}
              productName={product.name}
            />
            {product.material && (
              <span className="font-sans text-[11px] tracking-[0.16em] uppercase text-ink-faint">
                Crafted from {product.material}
              </span>
            )}
          </div>

          <ProductTrustBadges />

          <ProductAccordion
            sections={[
              {
                key: "description",
                title: "Description",
                body: <p className="m-0 whitespace-pre-line">{product.description}</p>,
              },
              {
                key: "specifications",
                title: "Specifications",
                body: (
                  <dl className="grid grid-cols-2 gap-y-2 gap-x-6 max-[520px]:grid-cols-1">
                    <SpecRow label="Material" value={product.material} />
                    <SpecRow label="Jewelry type" value={jewelryLabel} />
                    <SpecRow label="SKU" value={product.sku} />
                    <SpecRow
                      label="In stock"
                      value={product.inventory.toString()}
                    />
                    {product.healingStage && (
                      <SpecRow
                        label="Recommended for"
                        value={product.healingStage
                          .replace("_", " ")
                          .toLowerCase()}
                      />
                    )}
                  </dl>
                ),
              },
              {
                key: "sizing",
                title: "Sizing & fit",
                body: (
                  <p className="m-0">
                    Pick the gauge that matches your current jewelry. Not sure? Reach
                    out to our studio team on WhatsApp — we&apos;ll match you to the
                    right size.
                  </p>
                ),
              },
              {
                key: "care",
                title: "Care & cleaning",
                body: (
                  <p className="m-0">
                    Rinse with saline twice daily for fresh piercings. Polish with a
                    soft microfiber cloth. Avoid harsh chemicals, chlorine, and
                    submersion until fully healed.
                  </p>
                ),
              },
              {
                key: "shipping",
                title: "Shipping & returns",
                body: (
                  <p className="m-0">
                    Free shipping on TTD orders over $80. Trinidad & Tobago delivery
                    in 2–4 business days. Unworn pieces returnable within 14 days for
                    store credit.
                  </p>
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* <ProductReviews reviews={product.reviews} /> */}
      <RelatedProducts products={related} />
    </main>
  );
}

function SpecRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <dt className="font-sans text-[10px] tracking-[0.18em] uppercase text-ink-faint">
        {label}
      </dt>
      <dd className="font-serif text-[16px] text-ink m-0">{value}</dd>
    </div>
  );
}
