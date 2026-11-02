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
import { prisma } from "@/lib/db";
import { validatePopup, type PopupFormData } from "@/lib/admin/popup-validate";
import { POPUP_SELECT, toAdminPopup } from "@/lib/queries/admin";
import { deleteProductImages } from "@/lib/storage/r2";

// Popups the owner builds herself. The storefront reads them through
// /api/popups (site) and the checkout page (thank-you screen), neither of which
// is prerendered, so nothing here needs revalidating.

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The product and promo dropdowns can go stale; a deleted one is a 400, not a 500. */
async function checkReferences(d: PopupFormData): Promise<string | null> {
  const [product, promo] = await Promise.all([
    d.productId
      ? prisma.product.findUnique({ where: { id: d.productId }, select: { id: true } })
      : true,
    d.promoCodeId
      ? prisma.discountCode.findUnique({ where: { id: d.promoCodeId }, select: { id: true } })
      : true,
  ]);
  if (!product) return "That product no longer exists. Choose another.";
  if (!promo) return "That promo code no longer exists. Choose another.";
  return null;
}

/**
 * Remove a popup's old graphic from R2 once nothing points at it. The image
 * field takes any URL, so it may be a product or category photo pasted in —
 * deleting that would take the photo off the product too.
 */
async function deleteImageIfUnused(url: string): Promise<void> {
  const [popups, productImages, colors, categories, blogs] = await Promise.all([
    prisma.popup.count({ where: { imageUrl: url } }),
    prisma.productImage.count({ where: { imageUrl: url } }),
    prisma.productColor.count({ where: { imageUrl: url } }),
    prisma.category.count({ where: { imageUrl: url } }),
    prisma.blog.count({ where: { featuredImage: url } }),
  ]);
  if (popups + productImages + colors + categories + blogs === 0) {
    await deleteProductImages([url]);
  }
}

const KIND_LABEL = { ANNOUNCEMENT: "announcement", NEWSLETTER: "newsletter popup" } as const;

// --- Create ------------------------------------------------------------------

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const body = await readBody(request);
  if (body === null) return bad("Invalid JSON body.");

  const parsed = validatePopup(body);
  if (!parsed.ok) return bad(parsed.error);
  const d = parsed.data;

  const refError = await checkReferences(d);
  if (refError) return bad(refError);

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.popup.create({ data: d, select: POPUP_SELECT });
    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.popupCreate,
      entityType: "Popup",
      entityId: row.id,
      summary: `Created ${KIND_LABEL[row.kind]} “${row.name}”`,
      ip: auditIp(request),
    });
    return row;
  });
  maybePurgeAuditLogs();

  return NextResponse.json({ ok: true, popup: toAdminPopup(created) });
}

// --- Update ------------------------------------------------------------------

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const body = await readBody(request);
  if (body === null) return bad("Invalid JSON body.");

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return bad("Popup id is required.");

  const parsed = validatePopup(body);
  if (!parsed.ok) return bad(parsed.error);
  const d = parsed.data;

  const existing = await prisma.popup.findUnique({ where: { id }, select: POPUP_SELECT });
  if (!existing) return bad("Popup not found.", 404);

  const refError = await checkReferences(d);
  if (refError) return bad(refError);

  const changes = diffFields(existing, d, [
    "name",
    "kind",
    "layout",
    "placement",
    "imageUrl",
    "headline",
    "body",
    "ctaLabel",
    "productId",
    "ctaUrl",
    "showCountdown",
    "promoCodeId",
    "startsAt",
    "endsAt",
    "frequency",
    "delaySeconds",
    "priority",
    "active",
  ]);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.popup.update({ where: { id }, data: d, select: POPUP_SELECT });
    if (hasChanges(changes)) {
      await writeAuditLog(tx, {
        actor: admin,
        action: AUDIT_ACTIONS.popupUpdate,
        entityType: "Popup",
        entityId: id,
        summary: `Updated “${row.name}” (${Object.keys(changes).join(", ")})`,
        changes,
        ip: auditIp(request),
      });
    }
    return row;
  });
  maybePurgeAuditLogs();

  // Best effort, and only for images this bucket owns — an image hosted
  // elsewhere is never touched.
  if (existing.imageUrl && existing.imageUrl !== updated.imageUrl) {
    await deleteImageIfUnused(existing.imageUrl).catch(() => {});
  }

  return NextResponse.json({ ok: true, popup: toAdminPopup(updated) });
}

// --- Delete ------------------------------------------------------------------

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return bad("Popup id is required.");

  const existing = await prisma.popup.findUnique({
    where: { id },
    select: { id: true, name: true, kind: true, imageUrl: true },
  });
  if (!existing) return bad("Popup not found.", 404);

  await prisma.$transaction(async (tx) => {
    await tx.popup.delete({ where: { id } });
    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.popupDelete,
      entityType: "Popup",
      entityId: id,
      summary: `Deleted ${KIND_LABEL[existing.kind]} “${existing.name}”`,
      changes: { name: { from: existing.name, to: null } },
      ip: auditIp(request),
    });
  });
  maybePurgeAuditLogs();

  if (existing.imageUrl) await deleteImageIfUnused(existing.imageUrl).catch(() => {});

  return NextResponse.json({ ok: true, id });
}
