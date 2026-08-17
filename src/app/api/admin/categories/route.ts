import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { slugifyCategory } from "@/lib/admin/options";

// Categories are the storefront's filtering dimension: every row here becomes a
// chip on /products and a page at /products?category=<slug>. They are plain
// data, so an admin can add one without a migration — unlike Product.jewelryType,
// which is a Prisma enum.

type Parsed = {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function parseBody(body: unknown): { data: Parsed } | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = str(b.name);
  if (!name) return { error: "Name is required." };
  if (name.length > 60) return { error: "Name must be 60 characters or fewer." };

  // An empty slug is derived from the name, so the admin never has to think
  // about URLs — but a hand-typed one is respected and normalised.
  const slug = slugifyCategory(str(b.slug) || name);
  if (!slug) return { error: "Name must contain at least one letter or number." };

  const nullable = (v: unknown) => str(v) || null;

  return {
    data: {
      name,
      slug,
      description: nullable(b.description),
      imageUrl: nullable(b.imageUrl),
      seoTitle: nullable(b.seoTitle),
      seoDescription: nullable(b.seoDescription),
    },
  };
}

async function readBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Shape the client stores in state — mirrors AdminCategory. */
const SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  seoTitle: true,
  seoDescription: true,
} as const;

// --- Create ------------------------------------------------------------------

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const body = await readBody(request);
  if (body === null) return bad("Invalid JSON body.");

  const parsed = parseBody(body);
  if ("error" in parsed) return bad(parsed.error);
  const d = parsed.data;

  const clash = await prisma.category.findUnique({ where: { slug: d.slug }, select: { id: true } });
  if (clash) return bad(`The web address “/products?category=${d.slug}” is already taken.`, 409);

  const created = await prisma.category.create({ data: d, select: SELECT });
  return NextResponse.json({ ok: true, category: created });
}

// --- Update ------------------------------------------------------------------

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const body = await readBody(request);
  if (body === null) return bad("Invalid JSON body.");

  const id = typeof (body as { id?: unknown })?.id === "string" ? (body as { id: string }).id : "";
  if (!id) return bad("Category id is required.");

  const parsed = parseBody(body);
  if ("error" in parsed) return bad(parsed.error);
  const d = parsed.data;

  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!existing) return bad("Category not found.", 404);

  const clash = await prisma.category.findUnique({ where: { slug: d.slug }, select: { id: true } });
  if (clash && clash.id !== id) {
    return bad(`The web address “/products?category=${d.slug}” is already taken.`, 409);
  }

  // Changing the slug changes the category's public URL, so any link already
  // shared — or hardcoded in the footer — will stop resolving. Allowed, but the
  // form warns before it happens.
  const updated = await prisma.category.update({ where: { id }, data: d, select: SELECT });
  return NextResponse.json({ ok: true, category: updated });
}

// --- Delete ------------------------------------------------------------------

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return bad("Category id is required.");

  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, _count: { select: { products: true } } },
  });
  if (!existing) return bad("Category not found.", 404);

  // Product.categoryId is required with no onDelete rule, so the database would
  // reject this anyway. Refusing here turns a 500 into a message worth reading.
  const count = existing._count.products;
  if (count > 0) {
    return bad(
      `“${existing.name}” still has ${count} product${count === 1 ? "" : "s"}. ` +
        `Move ${count === 1 ? "it" : "them"} to another category first.`,
      409,
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true, id });
}
