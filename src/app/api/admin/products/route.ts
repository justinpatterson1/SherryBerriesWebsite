import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { getAdminProduct } from "@/lib/queries/admin";
import { prisma } from "@/lib/db";
import { JEWELRY_TYPE_VALUES } from "@/lib/admin/options";
import type { JewelryType } from "@/generated/prisma/client";

type Parsed = {
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  reorder: number;
  categoryId: string;
  jewelryType: JewelryType;
  material: string;
  featured: boolean;
  active: boolean;
  imageUrl: string;
};

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function parseBody(body: unknown): { data: Parsed } | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = str(b.name);
  if (!name) return { error: "Name is required." };
  const sku = str(b.sku);
  if (!sku) return { error: "SKU is required." };
  const shortDescription = str(b.shortDescription);
  if (!shortDescription) return { error: "A short description is required." };
  const description = str(b.description);
  if (!description) return { error: "A description is required." };

  const price = typeof b.price === "number" ? b.price : NaN;
  if (!Number.isFinite(price) || price < 0) return { error: "Price must be a non-negative number." };

  let compareAtPrice: number | null = null;
  if (b.compareAtPrice !== null && b.compareAtPrice !== undefined && b.compareAtPrice !== "") {
    const c = typeof b.compareAtPrice === "number" ? b.compareAtPrice : NaN;
    if (!Number.isFinite(c) || c < 0) return { error: "Compare-at price must be a non-negative number." };
    compareAtPrice = Number(c.toFixed(2));
  }

  const stock = typeof b.stock === "number" ? b.stock : NaN;
  if (!Number.isInteger(stock) || stock < 0) return { error: "Stock must be a non-negative whole number." };
  const reorder = typeof b.reorder === "number" ? b.reorder : NaN;
  if (!Number.isInteger(reorder) || reorder < 0)
    return { error: "Reorder threshold must be a non-negative whole number." };

  const categoryId = str(b.categoryId);
  if (!categoryId) return { error: "Please choose a category." };

  const jewelryType = str(b.jewelryType);
  if (!JEWELRY_TYPE_VALUES.includes(jewelryType)) return { error: "Please choose a valid jewelry type." };

  return {
    data: {
      name,
      sku,
      shortDescription,
      description,
      price: Number(price.toFixed(2)),
      compareAtPrice,
      stock,
      reorder,
      categoryId,
      jewelryType: jewelryType as JewelryType,
      material: str(b.material),
      featured: b.featured === true,
      active: b.active !== false,
      imageUrl: str(b.imageUrl),
    },
  };
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  // Append -2, -3, … until the slug is free.
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

// --- Create ------------------------------------------------------------------

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid JSON body.");
  }

  const parsed = parseBody(body);
  if ("error" in parsed) return bad(parsed.error);
  const d = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: d.categoryId }, select: { id: true } });
  if (!category) return bad("That category no longer exists.");

  const skuClash = await prisma.product.findUnique({ where: { sku: d.sku }, select: { id: true } });
  if (skuClash) return bad("That SKU is already in use.", 409);

  const slug = await uniqueSlug(slugify(d.name));

  const created = await prisma.product.create({
    data: {
      name: d.name,
      slug,
      shortDescription: d.shortDescription,
      description: d.description,
      sku: d.sku,
      price: d.price,
      compareAtPrice: d.compareAtPrice,
      inventory: d.stock,
      lowStockThreshold: d.reorder,
      jewelryType: d.jewelryType,
      material: d.material || null,
      featured: d.featured,
      active: d.active,
      categoryId: d.categoryId,
      images: d.imageUrl ? { create: [{ imageUrl: d.imageUrl, position: 0 }] } : undefined,
    },
    select: { id: true },
  });

  const product = await getAdminProduct(created.id);
  return NextResponse.json({ ok: true, product });
}

// --- Update ------------------------------------------------------------------

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid JSON body.");
  }

  const id = typeof (body as { id?: unknown })?.id === "string" ? (body as { id: string }).id : "";
  if (!id) return bad("Product id is required.");

  const parsed = parseBody(body);
  if ("error" in parsed) return bad(parsed.error);
  const d = parsed.data;

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return bad("Product not found.", 404);

  const category = await prisma.category.findUnique({ where: { id: d.categoryId }, select: { id: true } });
  if (!category) return bad("That category no longer exists.");

  const skuClash = await prisma.product.findUnique({ where: { sku: d.sku }, select: { id: true } });
  if (skuClash && skuClash.id !== id) return bad("That SKU is already in use.", 409);

  // Slug is intentionally left untouched on update so existing product URLs stay stable.
  await prisma.product.update({
    where: { id },
    data: {
      name: d.name,
      shortDescription: d.shortDescription,
      description: d.description,
      sku: d.sku,
      price: d.price,
      compareAtPrice: d.compareAtPrice,
      inventory: d.stock,
      lowStockThreshold: d.reorder,
      jewelryType: d.jewelryType,
      material: d.material || null,
      featured: d.featured,
      active: d.active,
      categoryId: d.categoryId,
    },
  });

  // Manage the primary (position 0) image only; an empty URL leaves it as-is.
  if (d.imageUrl) {
    const first = await prisma.productImage.findFirst({
      where: { productId: id },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    if (first) {
      await prisma.productImage.update({ where: { id: first.id }, data: { imageUrl: d.imageUrl } });
    } else {
      await prisma.productImage.create({ data: { productId: id, imageUrl: d.imageUrl, position: 0 } });
    }
  }

  const product = await getAdminProduct(id);
  return NextResponse.json({ ok: true, product });
}
