import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type CartSnapshotLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
  productName: string;
  productSlug: string;
  categoryName: string;
  imageUrl: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  variantValue: string | null;
  variantAdditional: number;
  unitPrice: number;
  productInventory: number;
  variantInventory: number | null;
  lowStockThreshold: number;
};

type RequestLine = { productId: string; variantId?: string | null; quantity: number };

export async function POST(request: Request) {
  const session = await auth();

  // For auth users, read from the DB cart. For guests, use the request body.
  let requested: RequestLine[];
  if (session?.user?.id) {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { cartItems: true },
    });
    requested =
      cart?.cartItems.map((it) => ({
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.quantity,
      })) ?? [];
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const raw = (body as { items?: unknown })?.items;
    requested = Array.isArray(raw)
      ? raw
          .filter(
            (r): r is RequestLine =>
              !!r &&
              typeof (r as RequestLine).productId === "string" &&
              typeof (r as RequestLine).quantity === "number",
          )
          .map((r) => ({
            productId: r.productId,
            variantId: typeof r.variantId === "string" ? r.variantId : null,
            quantity: Math.max(1, Math.min(10, Math.floor(r.quantity))),
          }))
      : [];
  }

  if (requested.length === 0) return NextResponse.json({ items: [] });

  const productIds = Array.from(new Set(requested.map((r) => r.productId)));
  const variantIds = Array.from(
    new Set(requested.map((r) => r.variantId).filter((v): v is string => !!v)),
  );

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        category: { select: { name: true } },
      },
    }),
    variantIds.length > 0
      ? prisma.productVariant.findMany({ where: { id: { in: variantIds } } })
      : Promise.resolve([]),
  ]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const variantById = new Map(variants.map((v) => [v.id, v]));

  const items: CartSnapshotLine[] = requested.flatMap((line) => {
    const product = productById.get(line.productId);
    if (!product) return [];
    const variant = line.variantId ? variantById.get(line.variantId) ?? null : null;
    const basePrice = Number(product.price);
    const variantAdditional = variant ? Number(variant.additionalPrice ?? 0) : 0;
    return [
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        quantity: line.quantity,
        productName: product.name,
        productSlug: product.slug,
        categoryName: product.category.name,
        imageUrl: product.images[0]?.imageUrl ?? null,
        basePrice,
        compareAtPrice: product.compareAtPrice
          ? Number(product.compareAtPrice)
          : null,
        variantValue: variant?.value ?? null,
        variantAdditional,
        unitPrice: basePrice + variantAdditional,
        productInventory: product.inventory,
        variantInventory: variant?.inventory ?? null,
        lowStockThreshold: product.lowStockThreshold,
      },
    ];
  });

  return NextResponse.json({ items });
}
