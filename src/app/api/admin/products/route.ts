import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  AUDIT_ACTIONS,
  auditIp,
  diffFields,
  hasChanges,
  maybePurgeAuditLogs,
  writeAuditLog,
} from "@/lib/admin/audit";
import { getAdminProduct } from "@/lib/queries/admin";
import { prisma } from "@/lib/db";
import { revalidateCatalog } from "@/lib/admin/revalidate";
import { JEWELRY_TYPE_VALUES } from "@/lib/admin/options";
import {
  sizesSummary,
  stockFromSizes,
  validateSizes,
  variantSku,
  type SizeRow,
} from "@/lib/admin/sizes";
import type { JewelryType, Prisma } from "@/generated/prisma/client";

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
  /** Null when the product has no sizes. */
  sizeLabel: string | null;
  sizes: SizeRow[];
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

  const sized = validateSizes(b.sizeLabel, b.sizes);
  if (!sized.ok) return { error: sized.error };

  // Only meaningful with no sizes — otherwise the total comes from them, and
  // rejecting a figure the client never uses produces a baffling error about
  // a field the modal shows as read-only.
  const stock = typeof b.stock === "number" ? b.stock : NaN;
  if (sized.sizes.length === 0 && (!Number.isInteger(stock) || stock < 0)) {
    return { error: "Stock must be a non-negative whole number." };
  }
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
      // A product with sizes carries the sum of them: both numbers are live
      // in checkout (an order line with a variantId decrements the variant,
      // one without decrements the product), so letting them drift is how a
      // shop oversells. The typed-in figure only survives with no sizes.
      stock: stockFromSizes(sized.sizes, stock),
      reorder,
      categoryId,
      jewelryType: jewelryType as JewelryType,
      material: str(b.material),
      featured: b.featured === true,
      active: b.active !== false,
      imageUrl: str(b.imageUrl),
      sizeLabel: sized.label,
      sizes: sized.sizes,
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

/**
 * Raised when a size cannot be removed. Surfaced as a 409 so the admin gets
 * the reason rather than a generic failure.
 */
class SizeConflict extends Error {}

/**
 * Bring a product's ProductVariant rows in line with the submitted sizes.
 *
 * Runs inside the product's own transaction, so a product and its sizes
 * always commit together.
 *
 * Removing a size DELETES the variant, and neither CartItem.variantId nor
 * OrderItem.variantId declares onDelete — Prisma defaults an optional
 * relation to SetNull. For an order that would silently erase which size the
 * customer actually bought, so a size that appears on any order is refused;
 * setting its quantity to 0 retires it while keeping the history. A size only
 * sitting in someone's cart is allowed to go: that line falls back to the
 * base product rather than losing a record of anything.
 */
async function syncSizes(
  tx: Prisma.TransactionClient,
  productId: string,
  productSku: string,
  label: string | null,
  sizes: SizeRow[],
): Promise<void> {
  const existing = await tx.productVariant.findMany({
    where: { productId },
    select: { id: true, value: true },
  });

  const kept = new Set(sizes.map((v) => v.id).filter((id): id is string => !!id));
  const removed = existing.filter((v) => !kept.has(v.id));

  if (removed.length > 0) {
    const ordered = await tx.orderItem.findMany({
      where: { variantId: { in: removed.map((v) => v.id) } },
      select: { variantId: true },
      distinct: ["variantId"],
    });
    if (ordered.length > 0) {
      const blockedIds = new Set(ordered.map((o) => o.variantId));
      const names = removed.filter((v) => blockedIds.has(v.id)).map((v) => `“${v.value}”`);
      throw new SizeConflict(
        `${names.join(", ")} ${names.length === 1 ? "has" : "have"} been ordered before. ` +
          "Set the quantity to 0 instead of removing it, so those orders keep a record of what was bought.",
      );
    }
    await tx.productVariant.deleteMany({ where: { id: { in: removed.map((v) => v.id) } } });
  }

  const updates = sizes.filter((v) => v.id && existing.some((e) => e.id === v.id));

  // Park every surviving row on a throwaway SKU first. SKUs are re-derived
  // from the product's own on each save, so swapping two sizes' values (8mm →
  // 10mm and 10mm → 8mm) would otherwise have the first update collide with
  // the second row's current SKU and fail the unique index mid-save.
  for (const size of updates) {
    await tx.productVariant.update({
      where: { id: size.id as string },
      data: { sku: `TMP-${size.id}` },
    });
  }

  for (const size of sizes) {
    const data = {
      name: label ?? "",
      value: size.value,
      inventory: size.quantity,
      additionalPrice: size.additionalPrice,
      sku: variantSku(productSku, size.value),
    };
    if (size.id && existing.some((v) => v.id === size.id)) {
      await tx.productVariant.update({ where: { id: size.id }, data });
    } else {
      await tx.productVariant.create({ data: { ...data, productId } });
    }
  }
}

/**
 * A derived variant SKU that is already taken. Possible across products —
 * product SKU `SB-1` with size `2` and product SKU `SB` with size `1-2` both
 * derive `SB-1-2` — so it is reported rather than left as a 500.
 */
function isDuplicateSku(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: unknown }).code === "P2002";
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

  let created: { id: string };
  try {
    created = await prisma.$transaction(async (tx) => {
      const row = await tx.product.create({
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

      await syncSizes(tx, row.id, d.sku, d.sizeLabel, d.sizes);

      await writeAuditLog(tx, {
        actor: admin,
        action: AUDIT_ACTIONS.productCreate,
        entityType: "Product",
        entityId: row.id,
        summary:
          `Created “${d.name}” (${d.sku}) at $${d.price.toFixed(2)}` +
          (d.sizes.length > 0 ? ` — ${sizesSummary(d.sizeLabel, d.sizes)}` : ""),
        ip: auditIp(request),
      });

      return row;
    });
  } catch (e) {
    if (e instanceof SizeConflict) return bad(e.message, 409);
    if (isDuplicateSku(e)) {
      return bad(
        "One of these sizes produces a SKU that is already in use. Change the product SKU or the size value.",
        409,
      );
    }
    throw e;
  }
  maybePurgeAuditLogs();
  revalidateCatalog();

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

  const existing = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      inventory: true,
      lowStockThreshold: true,
      shortDescription: true,
      description: true,
      jewelryType: true,
      material: true,
      featured: true,
      active: true,
      categoryId: true,
    },
  });
  if (!existing) return bad("Product not found.", 404);

  const category = await prisma.category.findUnique({ where: { id: d.categoryId }, select: { id: true } });
  if (!category) return bad("That category no longer exists.");

  const skuClash = await prisma.product.findUnique({ where: { sku: d.sku }, select: { id: true } });
  if (skuClash && skuClash.id !== id) return bad("That SKU is already in use.", 409);

  const sizesBefore = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, value: true, inventory: true, additionalPrice: true },
  });
  const beforeSummary = sizesSummary(
    sizesBefore[0]?.name ?? null,
    sizesBefore.map((v) => ({
      id: v.id,
      value: v.value,
      quantity: v.inventory,
      additionalPrice: v.additionalPrice == null ? null : Number(v.additionalPrice),
    })),
  );
  const afterSummary = sizesSummary(d.sizeLabel, d.sizes);

  const data = {
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
  };

  const changes = diffFields(existing, data, [
    "name",
    "sku",
    "price",
    "compareAtPrice",
    "inventory",
    "lowStockThreshold",
    "shortDescription",
    "description",
    "jewelryType",
    "material",
    "featured",
    "active",
    "categoryId",
  ]);

  // Slug is intentionally left untouched on update so existing product URLs stay stable.
  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });
      await syncSizes(tx, id, d.sku, d.sizeLabel, d.sizes);

      // Logged apart from the product edit: a stock change is a different
      // kind of event from a price or copy change, and worth filtering for.
      if (beforeSummary !== afterSummary) {
        await writeAuditLog(tx, {
          actor: admin,
          action: AUDIT_ACTIONS.productSizesUpdate,
          entityType: "Product",
          entityId: id,
          summary: `${d.name} sizes: ${beforeSummary} → ${afterSummary}`,
          changes: { sizes: { from: beforeSummary, to: afterSummary } },
          ip: auditIp(request),
        });
      }

      if (hasChanges(changes)) {
        await writeAuditLog(tx, {
          actor: admin,
          action: AUDIT_ACTIONS.productUpdate,
          entityType: "Product",
          entityId: id,
          // Price is the field worth reading at a glance; everything else is
          // listed by name and the detail sits in `changes`.
          summary: changes.price
            ? `${d.name}: price $${Number(changes.price.from).toFixed(2)} → $${Number(changes.price.to).toFixed(2)}`
            : `${d.name}: updated ${Object.keys(changes).join(", ")}`,
          changes,
          ip: auditIp(request),
        });
      }
    });
  } catch (e) {
    if (e instanceof SizeConflict) return bad(e.message, 409);
    if (isDuplicateSku(e)) {
      return bad(
        "One of these sizes produces a SKU that is already in use. Change the product SKU or the size value.",
        409,
      );
    }
    throw e;
  }
  maybePurgeAuditLogs();
  revalidateCatalog();

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
