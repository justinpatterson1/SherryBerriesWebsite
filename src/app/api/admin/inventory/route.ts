import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import {
  AUDIT_ACTIONS,
  auditIp,
  diffFields,
  hasChanges,
  maybePurgeAuditLogs,
  writeAuditLog,
  type ChangeSet,
} from "@/lib/admin/audit";
import { prisma } from "@/lib/db";

type Edit = { id: string; price: number; stock: number };

/** "price $45.00 → $39.00, stock 12 → 8" */
function describeInventoryChange(changes: ChangeSet): string {
  const money = (v: unknown) => `$${Number(v).toFixed(2)}`;
  return Object.entries(changes)
    .map(([field, c]) =>
      field === "price"
        ? `price ${money(c.from)} → ${money(c.to)}`
        : `stock ${String(c.from)} → ${String(c.to)}`,
    )
    .join(", ");
}

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

  // Read the current values first so the log can record what each number moved
  // from — a bulk save otherwise leaves no trace of the previous price.
  const before = await prisma.product.findMany({
    where: { id: { in: edits.map((e) => e.id) } },
    select: { id: true, name: true, price: true, inventory: true },
  });
  const beforeById = new Map(before.map((p) => [p.id, p]));

  const ip = auditIp(request);

  await prisma.$transaction(async (tx) => {
    for (const e of edits) {
      await tx.product.update({
        where: { id: e.id },
        data: { price: e.price, inventory: e.stock },
      });

      const prev = beforeById.get(e.id);
      if (!prev) continue;
      const changes = diffFields(
        { price: prev.price, inventory: prev.inventory },
        { price: e.price, inventory: e.stock },
        ["price", "inventory"],
      );
      // One row per product that actually moved, not one per batch: this is
      // what makes "show me everything that happened to this product" work,
      // and an untouched row in a bulk save is not a change worth recording.
      if (!hasChanges(changes)) continue;
      await writeAuditLog(tx, {
        actor: admin,
        action: AUDIT_ACTIONS.inventoryUpdate,
        entityType: "Product",
        entityId: e.id,
        summary: `${prev.name}: ${describeInventoryChange(changes)}`,
        changes,
        ip,
      });
    }
  });
  maybePurgeAuditLogs();

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
