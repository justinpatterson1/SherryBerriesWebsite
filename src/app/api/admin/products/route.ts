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
import { deleteProductImages } from "@/lib/storage/r2";
import { validateDigitalProduct } from "@/lib/admin/options";
import { colorsSummary, type ColorRow } from "@/lib/admin/colors";
import type { SizeRow } from "@/lib/admin/sizes";
import {
  matchVariants,
  stockFromVariants,
  validateVariants,
  variantLabel,
  variantSku,
  variantsSummary,
  type VariantRow,
} from "@/lib/admin/variants";
import type { Prisma } from "@/generated/prisma/client";

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
  material: string;
  careInstructions: string;
  featured: boolean;
  active: boolean;
  imageUrl: string;
  /** Null when the product has no sizes. */
  sizeLabel: string | null;
  sizes: SizeRow[];
  colors: ColorRow[];
  /** One per stock line; empty with neither sizes nor colours. */
  variants: VariantRow[];
  isDigital: boolean;
  digitalFileKey: string | null;
  digitalFileName: string | null;
  isPreorder: boolean;
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

  const lines = validateVariants({
    sizeLabel: b.sizeLabel,
    sizes: b.sizes,
    colors: b.colors,
    stock: b.variantStock,
  });
  if (!lines.ok) return { error: lines.error };

  const isDigital = b.isDigital === true;
  const isPreorder = b.isPreorder === true;
  // A file never runs short, so there is nothing to preorder.
  if (isPreorder && isDigital) return { error: "A digital product can't be a preorder." };

  // Only meaningful with no stock lines — otherwise the total comes from them, and
  // rejecting a figure the client never uses produces a baffling error about
  // a field the modal shows as read-only. A download has no stock at all, so
  // neither figure is required of it, and a preorder has none yet.
  const stock = typeof b.stock === "number" ? b.stock : NaN;
  if (!isDigital && !isPreorder && lines.variants.length === 0 && (!Number.isInteger(stock) || stock < 0)) {
    return { error: "Stock must be a non-negative whole number." };
  }
  const reorder = typeof b.reorder === "number" ? b.reorder : NaN;
  if (!isDigital && (!Number.isInteger(reorder) || reorder < 0))
    return { error: "Reorder threshold must be a non-negative whole number." };

  const digital = validateDigitalProduct({
    isDigital,
    digitalFileKey: str(b.digitalFileKey),
    sizeCount: lines.variants.length,
    stock: stockFromVariants(lines.variants, stock),
    reorder,
  });
  if (!digital.ok) return { error: digital.error };

  const categoryId = str(b.categoryId);
  if (!categoryId) return { error: "Please choose a category." };

  return {
    data: {
      name,
      sku,
      shortDescription,
      description,
      price: Number(price.toFixed(2)),
      compareAtPrice,
      // A product with stock lines carries the sum of them: both numbers are live
      // in checkout (an order line with a variantId decrements the variant,
      // one without decrements the product), so letting them drift is how a
      // shop oversells. The typed-in figure only survives with no sizes, and
      // a download is pinned to 0 — a file cannot run out. So is a preorder,
      // which is sold before the stock exists; its sizes go to 0 with it, and
      // the admin enters real figures when it comes off preorder.
      stock: isPreorder ? 0 : digital.stock,
      reorder: digital.reorder,
      categoryId,
      material: str(b.material),
      careInstructions: str(b.careInstructions),
      featured: b.featured === true,
      active: b.active !== false,
      imageUrl: str(b.imageUrl),
      sizeLabel: lines.label,
      sizes: lines.sizes,
      colors: lines.colors,
      variants: isPreorder ? lines.variants.map((v) => ({ ...v, quantity: 0 })) : lines.variants,
      isDigital,
      digitalFileKey: digital.digitalFileKey,
      digitalFileName: isDigital ? str(b.digitalFileName) || null : null,
      isPreorder,
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
 * Raised when a size, colour or combination cannot be removed. Surfaced as a
 * 409 so the admin gets the reason rather than a generic failure.
 */
class SizeConflict extends Error {}

/**
 * Bring a product's ProductColor and ProductVariant rows in line with the
 * submitted colours and stock lines.
 *
 * Runs inside the product's own transaction, so a product, its colours and its
 * stock lines always commit together.
 *
 * Removing a line DELETES the variant, and neither CartItem.variantId nor
 * OrderItem.variantId declares onDelete — Prisma defaults an optional
 * relation to SetNull. For an order that would silently erase what the
 * customer actually bought, so a line that appears on any order is refused —
 * and with it, removing the size or colour it belongs to. Setting its quantity
 * to 0 retires it while keeping the history. A line only sitting in someone's
 * cart is allowed to go: that line falls back to the base product rather than
 * losing a record of anything.
 */
async function syncVariants(
  tx: Prisma.TransactionClient,
  productId: string,
  productSku: string,
  label: string | null,
  sizes: SizeRow[],
  colors: ColorRow[],
  variants: VariantRow[],
): Promise<void> {
  const [existingColors, existing] = await Promise.all([
    tx.productColor.findMany({ where: { productId }, select: { id: true } }),
    tx.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
      select: { id: true, colorId: true, size: true, value: true },
    }),
  ]);

  // Colours first: the variants below point at their ids. A colour id from
  // the request that is not this product's is treated as new rather than
  // trusted, so it cannot move another product's colour.
  const colorIds: string[] = [];
  for (const [position, color] of colors.entries()) {
    const data = {
      name: color.name,
      swatch: color.swatch,
      imageUrl: color.imageUrl,
      additionalPrice: color.additionalPrice,
      position,
    };
    if (color.id && existingColors.some((c) => c.id === color.id)) {
      await tx.productColor.update({ where: { id: color.id }, data });
      colorIds.push(color.id);
    } else {
      const row = await tx.productColor.create({ data: { ...data, productId }, select: { id: true } });
      colorIds.push(row.id);
    }
  }

  const { ids, removed } = matchVariants(existing, variants, colorIds, sizes);

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

  // Park every surviving row on a throwaway SKU first. SKUs are re-derived
  // from the product's own on each save, so swapping two sizes' values (8mm →
  // 10mm and 10mm → 8mm) would otherwise have the first update collide with
  // the second row's current SKU and fail the unique index mid-save.
  for (const id of ids) {
    if (id) await tx.productVariant.update({ where: { id }, data: { sku: `TMP-${id}` } });
  }

  for (const [i, line] of variants.entries()) {
    const color = line.colorIndex === null ? null : colors[line.colorIndex];
    const data = {
      name: label ?? "",
      value: variantLabel(color?.name ?? null, line.size),
      size: line.size,
      colorId: line.colorIndex === null ? null : colorIds[line.colorIndex],
      inventory: line.quantity,
      additionalPrice: line.additionalPrice,
      sku: variantSku(productSku, [color?.name ?? null, line.size]),
    };
    const id = ids[i];
    if (id) {
      await tx.productVariant.update({ where: { id }, data });
    } else {
      await tx.productVariant.create({ data: { ...data, productId } });
    }
  }

  // Last, once nothing points at them.
  const droppedColors = existingColors.filter((c) => !colorIds.includes(c.id));
  if (droppedColors.length > 0) {
    await tx.productColor.deleteMany({ where: { id: { in: droppedColors.map((c) => c.id) } } });
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
  // With no main image chosen, the first colour's photo becomes the cover, so
  // the shop grid and cart do not show a coloured product as a blank tile.
  const cover = d.imageUrl || d.colors[0]?.imageUrl || "";

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
          material: d.material || null,
          careInstructions: d.careInstructions || null,
          featured: d.featured,
          active: d.active,
          isDigital: d.isDigital,
          digitalFileKey: d.digitalFileKey,
          digitalFileName: d.digitalFileName,
          isPreorder: d.isPreorder,
          categoryId: d.categoryId,
          images: cover ? { create: [{ imageUrl: cover, position: 0 }] } : undefined,
        },
        select: { id: true },
      });

      await syncVariants(tx, row.id, d.sku, d.sizeLabel, d.sizes, d.colors, d.variants);

      await writeAuditLog(tx, {
        actor: admin,
        action: AUDIT_ACTIONS.productCreate,
        entityType: "Product",
        entityId: row.id,
        summary:
          `Created “${d.name}” (${d.sku}) at $${d.price.toFixed(2)}` +
          (d.variants.length > 0 ? `: ${variantsSummary(d.sizeLabel, d.variants)}` : "") +
          (d.colors.length > 0 ? `. Colours: ${colorsSummary(d.colors)}` : ""),
        ip: auditIp(request),
      });

      return row;
    });
  } catch (e) {
    if (e instanceof SizeConflict) return bad(e.message, 409);
    if (isDuplicateSku(e)) {
      return bad(
        "One of these sizes or colours produces a SKU that is already in use. Change the product SKU, the size or the colour name.",
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
      material: true,
      careInstructions: true,
      featured: true,
      active: true,
      isDigital: true,
      digitalFileKey: true,
      isPreorder: true,
      categoryId: true,
    },
  });
  if (!existing) return bad("Product not found.", 404);

  const category = await prisma.category.findUnique({ where: { id: d.categoryId }, select: { id: true } });
  if (!category) return bad("That category no longer exists.");

  const skuClash = await prisma.product.findUnique({ where: { sku: d.sku }, select: { id: true } });
  if (skuClash && skuClash.id !== id) return bad("That SKU is already in use.", 409);

  const [linesBefore, colorsBefore] = await Promise.all([
    prisma.productVariant.findMany({
      where: { productId: id },
      orderBy: { createdAt: "asc" },
      select: { name: true, value: true, inventory: true, additionalPrice: true },
    }),
    prisma.productColor.findMany({
      where: { productId: id },
      orderBy: { position: "asc" },
      select: { name: true, swatch: true, imageUrl: true, additionalPrice: true },
    }),
  ]);
  const price = (p: unknown) => (p == null ? null : Number(p));
  const beforeSummary = variantsSummary(
    linesBefore[0]?.name || null,
    linesBefore.map((v) => ({ value: v.value, quantity: v.inventory, additionalPrice: price(v.additionalPrice) })),
  );
  const afterSummary = variantsSummary(d.sizeLabel, d.variants);
  const colorsBeforeSummary = colorsSummary(
    colorsBefore.map((c) => ({ ...c, additionalPrice: price(c.additionalPrice) })),
  );
  const colorsAfterSummary = colorsSummary(d.colors);

  const data = {
    name: d.name,
    shortDescription: d.shortDescription,
    description: d.description,
    sku: d.sku,
    price: d.price,
    compareAtPrice: d.compareAtPrice,
    inventory: d.stock,
    lowStockThreshold: d.reorder,
    material: d.material || null,
    careInstructions: d.careInstructions || null,
    featured: d.featured,
    active: d.active,
    isDigital: d.isDigital,
    // Keep the existing file when the form did not send a new one, so editing
    // a digital product's price cannot silently detach its PDF.
    digitalFileKey: d.isDigital ? d.digitalFileKey ?? existing.digitalFileKey : null,
    digitalFileName: d.digitalFileName,
    isPreorder: d.isPreorder,
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
    "material",
    "careInstructions",
    "featured",
    "active",
    "isDigital",
    "digitalFileKey",
    "isPreorder",
    "categoryId",
  ]);

  // Slug is intentionally left untouched on update so existing product URLs stay stable.
  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });
      await syncVariants(tx, id, d.sku, d.sizeLabel, d.sizes, d.colors, d.variants);

      // Logged apart from the product edit: a change to the stock lines or
      // the colours is a different kind of event from a price or copy
      // change, and worth filtering for.
      const linesChanged = beforeSummary !== afterSummary;
      const colorsChanged = colorsBeforeSummary !== colorsAfterSummary;
      if (linesChanged || colorsChanged) {
        await writeAuditLog(tx, {
          actor: admin,
          action: AUDIT_ACTIONS.productSizesUpdate,
          entityType: "Product",
          entityId: id,
          summary: [
            linesChanged && `${d.name} sizes: ${beforeSummary} → ${afterSummary}`,
            colorsChanged && `${d.name} colours: ${colorsBeforeSummary} → ${colorsAfterSummary}`,
          ]
            .filter(Boolean)
            .join(". "),
          changes: {
            ...(linesChanged && { sizes: { from: beforeSummary, to: afterSummary } }),
            ...(colorsChanged && { colors: { from: colorsBeforeSummary, to: colorsAfterSummary } }),
          },
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
        "One of these sizes or colours produces a SKU that is already in use. Change the product SKU, the size or the colour name.",
        409,
      );
    }
    throw e;
  }
  maybePurgeAuditLogs();
  revalidateCatalog();

  // Manage the primary (position 0) image only; an empty URL leaves it as-is.
  // A product with no image at all takes the first colour's photo as its
  // cover, as on create — but an existing cover is never swapped for one.
  const first = await prisma.productImage.findFirst({
    where: { productId: id },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  if (d.imageUrl && first) {
    await prisma.productImage.update({ where: { id: first.id }, data: { imageUrl: d.imageUrl } });
  } else if (!first && (d.imageUrl || d.colors[0])) {
    await prisma.productImage.create({
      data: { productId: id, imageUrl: d.imageUrl || d.colors[0].imageUrl, position: 0 },
    });
  }

  const product = await getAdminProduct(id);
  return NextResponse.json({ ok: true, product });
}

// --- Delete ------------------------------------------------------------------

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return bad("Product id is required.");

  const existing = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      sku: true,
      active: true,
      images: { select: { imageUrl: true } },
      colors: { select: { imageUrl: true } },
      _count: { select: { orderItems: true, variants: true } },
    },
  });
  if (!existing) return bad("Product not found.", 404);

  // OrderItem.productId is required with no onDelete rule, so Postgres would
  // RESTRICT this anyway. Refusing here turns a 500 into a message worth
  // reading — and the right answer is almost always to deactivate instead,
  // which hides the product from the storefront while past orders keep saying
  // what was bought.
  const ordered = existing._count.orderItems;
  if (ordered > 0) {
    return bad(
      `“${existing.name}” appears on ${ordered} order line${ordered === 1 ? "" : "s"}. ` +
        "Untick Active in the product instead. Deleting it would erase what those customers bought.",
      409,
    );
  }

  const imageUrls = existing.images.map((i) => i.imageUrl);
  // Colour photos are uploaded to the same bucket and would otherwise be left
  // behind with nothing pointing at them.
  const colorUrls = existing.colors.map((c) => c.imageUrl);

  await prisma.$transaction(async (tx) => {
    // Images, colours, sizes, reviews and wishlist entries cascade. Cart lines do not
    // (CartItem.productId is required and declares no rule), so they go first:
    // a line pointing at a product nobody can buy is dead weight, and leaving
    // it would block the delete outright.
    await tx.cartItem.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });

    // Deletion leaves nothing to inspect afterwards, so the log keeps the name
    // and SKU — otherwise the row would point at an id that resolves to
    // nothing.
    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.productDelete,
      entityType: "Product",
      entityId: id,
      summary:
        `Deleted “${existing.name}” (${existing.sku})` +
        (imageUrls.length > 0
          ? `: ${imageUrls.length} image${imageUrls.length === 1 ? "" : "s"}`
          : "") +
        (existing._count.variants > 0
          ? `, ${existing._count.variants} stock line${existing._count.variants === 1 ? "" : "s"}`
          : ""),
      changes: { name: { from: existing.name, to: null }, sku: { from: existing.sku, to: null } },
      ip: auditIp(request),
    });
  });
  maybePurgeAuditLogs();
  revalidateCatalog();

  // After the row is gone, and never fatal: the product is already deleted, so
  // a storage hiccup must not be reported as a failed delete. Only images this
  // bucket actually owns are touched — a pasted external URL is left alone.
  await deleteProductImages([...imageUrls, ...colorUrls]);

  return NextResponse.json({ ok: true, id });
}
