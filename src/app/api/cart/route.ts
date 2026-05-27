import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ items: [] });

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      cartItems: {
        include: {
          product: { select: { name: true, slug: true, price: true } },
          variant: { select: { value: true, additionalPrice: true } },
        },
      },
    },
  });
  if (!cart) return NextResponse.json({ items: [] });

  return NextResponse.json({
    items: cart.cartItems.map((it) => ({
      id: it.id,
      productId: it.productId,
      variantId: it.variantId,
      quantity: it.quantity,
      productName: it.product.name,
      productSlug: it.product.slug,
      variantValue: it.variant?.value ?? null,
      unitPrice:
        Number(it.product.price) + Number(it.variant?.additionalPrice ?? 0),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { productId, variantId, quantity } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }
  const qty = typeof quantity === "number" ? quantity : 1;
  if (qty < 1 || qty > 10) {
    return NextResponse.json(
      { error: "Quantity must be between 1 and 10." },
      { status: 400 },
    );
  }
  const variant = typeof variantId === "string" && variantId ? variantId : null;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, active: true, inventory: true },
  });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Product not available." }, { status: 404 });
  }

  const cart = await prisma.cart.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variant },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(10, existing.quantity + qty) },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId: variant, quantity: qty },
    });
  }

  const count = await prisma.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { quantity: true },
  });

  return NextResponse.json({ ok: true, count: count._sum.quantity ?? 0 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { productId, variantId, quantity } =
    (body ?? {}) as Record<string, unknown>;
  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }
  if (typeof quantity !== "number" || quantity < 1 || quantity > 10) {
    return NextResponse.json(
      { error: "Quantity must be between 1 and 10." },
      { status: 400 },
    );
  }
  const variant = typeof variantId === "string" && variantId ? variantId : null;

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!cart) return NextResponse.json({ ok: true, count: 0 });

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variant },
  });
  if (!existing) {
    return NextResponse.json({ error: "Item not in cart." }, { status: 404 });
  }
  await prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity },
  });

  const agg = await prisma.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { quantity: true },
  });
  return NextResponse.json({ ok: true, count: agg._sum.quantity ?? 0 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const variantId = url.searchParams.get("variantId");
  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }
  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!cart) return NextResponse.json({ ok: true, count: 0 });

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId, variantId: variantId || null },
  });

  const agg = await prisma.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { quantity: true },
  });
  return NextResponse.json({ ok: true, count: agg._sum.quantity ?? 0 });
}
