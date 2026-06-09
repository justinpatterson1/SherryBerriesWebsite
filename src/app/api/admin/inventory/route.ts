import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

type Edit = { id: string; price: number; stock: number };

function stockStatus(stock: number, reorder: number): "In stock" | "Low stock" | "Out of stock" {
  if (stock <= 0) return "Out of stock";
  if (stock <= reorder) return "Low stock";
  return "In stock";
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (body as { edits?: unknown })?.edits;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "No edits provided." }, { status: 400 });
  }

  const edits: Edit[] = [];
  for (const e of raw) {
    const { id, price, stock } = (e ?? {}) as Record<string, unknown>;
    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "Each edit needs a product id." }, { status: 400 });
    }
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
    }
    if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Stock must be a non-negative whole number." }, { status: 400 });
    }
    edits.push({ id, price: Number(price.toFixed(2)), stock });
  }

  await prisma.$transaction(
    edits.map((e) =>
      prisma.product.update({
        where: { id: e.id },
        data: { price: e.price, inventory: e.stock },
      }),
    ),
  );

  // Re-read so the client can refresh stock-status pills from authoritative data.
  const updated = await prisma.product.findMany({
    where: { id: { in: edits.map((e) => e.id) } },
    select: { id: true, price: true, inventory: true, lowStockThreshold: true },
  });

  return NextResponse.json({
    ok: true,
    products: updated.map((p) => ({
      id: p.id,
      price: Number(p.price),
      stock: p.inventory,
      status: stockStatus(p.inventory, p.lowStockThreshold),
    })),
  });
}
