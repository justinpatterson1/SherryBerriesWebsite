/**
 * Copy the catalogue from the dev database to production.
 *
 *   npx tsx scripts/promote-to-prod.ts              # dry run (default)
 *   npx tsx scripts/promote-to-prod.ts --apply
 *   npx tsx scripts/promote-to-prod.ts --apply --include-admin --include-subscribers
 *
 * Source is DATABASE_URL from `.env`, target is DATABASE_URL from
 * `.env.production` — the same split `next build` uses, which is how the two
 * databases came to drift apart in the first place.
 *
 * ## What it does and does not do
 *
 * Matches on natural keys — category `slug`, product `sku`, variant `sku`, tag
 * `name` — rather than copying cuids, so production keeps its own ids and the
 * script can run repeatedly without duplicating anything.
 *
 * It never deletes a product or category that exists only in production; those
 * are reported instead. Deleting live catalogue rows because they are absent
 * from a developer's database is not a thing a sync script should decide.
 *
 * Orders, carts, wishlists and reviews are never touched.
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const APPLY = process.argv.includes("--apply");
const INCLUDE_ADMIN = process.argv.includes("--include-admin");
const INCLUDE_SUBSCRIBERS = process.argv.includes("--include-subscribers");

function readUrl(file: string): string {
  const parsed = config({ path: file, override: true }).parsed ?? {};
  const url = parsed.DATABASE_URL;
  if (!url) throw new Error(`${file} has no DATABASE_URL.`);
  return url;
}

function clientFor(url: string) {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url.replace(/([?&]sslmode=)(prefer|require|verify-ca)\b/i, "$1verify-full"),
    }),
  });
}

const host = (url: string) => new URL(url.replace(/^postgres(ql)?:\/\//, "https://")).hostname;

async function migrationCount(db: PrismaClient): Promise<number> {
  const rows = await db.$queryRawUnsafe<Array<{ c: bigint }>>(
    `SELECT count(*)::bigint AS c FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`,
  );
  return Number(rows[0].c);
}

async function main() {
  const devUrl = readUrl(".env");
  const prodUrl = readUrl(".env.production");
  if (host(devUrl) === host(prodUrl)) {
    throw new Error("REFUSING: .env and .env.production point at the same host.");
  }

  const dev = clientFor(devUrl);
  const prod = clientFor(prodUrl);

  try {
    console.log(`source (dev)   ${host(devUrl)}`);
    console.log(`target (prod)  ${host(prodUrl)}`);
    console.log(APPLY ? "\nMODE: APPLY — writing to production\n" : "\nMODE: dry run — pass --apply to write\n");

    // A schema behind the source will fail mid-copy with a column error, which
    // is the worst time to find out. Check before touching anything.
    const [devMigrations, prodMigrations] = await Promise.all([migrationCount(dev), migrationCount(prod)]);
    if (prodMigrations < devMigrations) {
      throw new Error(
        `REFUSING: production has ${prodMigrations} migrations, dev has ${devMigrations}. ` +
          `Run: DATABASE_URL=<prod> npx prisma migrate deploy`,
      );
    }

    // ---- tags -----------------------------------------------------------------
    const devTags = await dev.productTag.findMany({ select: { name: true } });
    let tagsCreated = 0;
    for (const t of devTags) {
      const found = await prod.productTag.findUnique({ where: { name: t.name }, select: { id: true } });
      if (found) continue;
      tagsCreated++;
      if (APPLY) await prod.productTag.create({ data: { name: t.name } });
    }
    console.log(`tags        ${devTags.length} in dev, ${tagsCreated} to create`);

    // ---- categories -----------------------------------------------------------
    const devCategories = await dev.category.findMany();
    let catsCreated = 0;
    let catsUpdated = 0;
    for (const c of devCategories) {
      const data = {
        name: c.name,
        description: c.description,
        imageUrl: c.imageUrl,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
        isJewelry: c.isJewelry,
      };
      const existing = await prod.category.findUnique({ where: { slug: c.slug }, select: { id: true } });
      if (existing) {
        catsUpdated++;
        if (APPLY) await prod.category.update({ where: { slug: c.slug }, data });
      } else {
        catsCreated++;
        if (APPLY) await prod.category.create({ data: { ...data, slug: c.slug } });
      }
    }
    console.log(`categories  ${devCategories.length} in dev — ${catsCreated} new, ${catsUpdated} updated`);

    // slug → production id, so products attach to the right row.
    const prodCategories = APPLY
      ? await prod.category.findMany({ select: { id: true, slug: true } })
      : [];
    const categoryIdBySlug = new Map(prodCategories.map((c) => [c.slug, c.id]));
    const devCategorySlugById = new Map(devCategories.map((c) => [c.id, c.slug]));

    // ---- products -------------------------------------------------------------
    const devProducts = await dev.product.findMany({
      include: { images: { orderBy: { position: "asc" } }, variants: true, tags: { select: { name: true } } },
    });
    let prodCreated = 0;
    let prodUpdated = 0;
    let imagesWritten = 0;
    let variantsWritten = 0;
    const variantsKept: string[] = [];

    for (const p of devProducts) {
      const slug = devCategorySlugById.get(p.categoryId);
      if (!slug) throw new Error(`Product ${p.sku} has an unknown categoryId.`);

      const fields = {
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        inventory: p.inventory,
        lowStockThreshold: p.lowStockThreshold,
        featured: p.featured,
        active: p.active,
        material: p.material,
        careInstructions: p.careInstructions,
        healingStage: p.healingStage,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
      };

      const existing = await prod.product.findUnique({ where: { sku: p.sku }, select: { id: true } });
      let productId = existing?.id ?? "";

      if (existing) {
        prodUpdated++;
        if (APPLY) {
          await prod.product.update({
            where: { sku: p.sku },
            data: {
              ...fields,
              category: { connect: { id: categoryIdBySlug.get(slug)! } },
              tags: { set: [], connect: p.tags.map((t) => ({ name: t.name })) },
            },
          });
        }
      } else {
        prodCreated++;
        if (APPLY) {
          const created = await prod.product.create({
            data: {
              ...fields,
              sku: p.sku,
              category: { connect: { id: categoryIdBySlug.get(slug)! } },
              tags: { connect: p.tags.map((t) => ({ name: t.name })) },
            },
            select: { id: true },
          });
          productId = created.id;
        }
      }

      imagesWritten += p.images.length;
      variantsWritten += p.variants.length;
      if (!APPLY) continue;

      // Images have no natural key and nothing references them, so the simplest
      // correct thing is to replace the set.
      await prod.productImage.deleteMany({ where: { productId } });
      for (const img of p.images) {
        await prod.productImage.create({
          data: { productId, imageUrl: img.imageUrl, altText: img.altText, position: img.position },
        });
      }

      // Variants DO get referenced by OrderItem and CartItem, so they are
      // upserted on their unique sku rather than replaced. A production variant
      // missing from dev is left alone and reported: deleting one would either
      // fail on a foreign key or orphan an order line.
      for (const v of p.variants) {
        await prod.productVariant.upsert({
          where: { sku: v.sku },
          update: { productId, name: v.name, value: v.value, inventory: v.inventory, additionalPrice: v.additionalPrice },
          create: { productId, name: v.name, value: v.value, sku: v.sku, inventory: v.inventory, additionalPrice: v.additionalPrice },
        });
      }
      const devSkus = new Set(p.variants.map((v) => v.sku));
      const extra = await prod.productVariant.findMany({ where: { productId }, select: { sku: true } });
      for (const e of extra) if (!devSkus.has(e.sku)) variantsKept.push(e.sku);
    }

    console.log(`products    ${devProducts.length} in dev — ${prodCreated} new, ${prodUpdated} updated`);
    console.log(`images      ${imagesWritten} (replaced per product)`);
    console.log(`variants    ${variantsWritten} upserted by sku`);
    if (variantsKept.length) {
      console.log(`  ⚠ left alone (in prod, not in dev): ${variantsKept.join(", ")}`);
    }

    // ---- optional extras ------------------------------------------------------
    if (INCLUDE_ADMIN) {
      const admins = await dev.user.findMany({ where: { role: { in: ["ADMIN", "SUPERADMIN"] }, deletedAt: null } });
      for (const a of admins) {
        const existing = await prod.user.findUnique({ where: { email: a.email }, select: { id: true } });
        console.log(`admin       ${a.email} (${a.role}) — ${existing ? "already present" : "to create"}`);
        if (!APPLY || existing) continue;
        // The password hash copies across, so the credentials you already have
        // work on both. Nothing is re-hashed and no plaintext is involved.
        await prod.user.create({
          data: {
            email: a.email, firstName: a.firstName, lastName: a.lastName, name: a.name,
            password: a.password, emailVerified: a.emailVerified, role: a.role, phoneNumber: a.phoneNumber,
          },
        });
      }
    }

    if (INCLUDE_SUBSCRIBERS) {
      const subs = await dev.newsletterSubscriber.findMany();
      let created = 0;
      for (const s of subs) {
        const existing = await prod.newsletterSubscriber.findUnique({ where: { email: s.email }, select: { id: true } });
        if (existing) continue;
        created++;
        if (APPLY) {
          await prod.newsletterSubscriber.create({
            data: { email: s.email, subscribedAt: s.subscribedAt, unsubscribedAt: s.unsubscribedAt, source: s.source, unsubscribeToken: s.unsubscribeToken },
          });
        }
      }
      console.log(`subscribers ${subs.length} in dev, ${created} to create`);
    }

    // ---- what production has that dev does not --------------------------------
    const devSlugs = new Set(devProducts.map((p) => p.slug));
    const prodOnly = (await prod.product.findMany({ select: { slug: true } })).filter((p) => !devSlugs.has(p.slug));
    if (prodOnly.length) {
      console.log(`\n⚠ ${prodOnly.length} product(s) exist in production but not in dev — left untouched:`);
      for (const p of prodOnly) console.log(`   ${p.slug}`);
    }

    if (APPLY) {
      console.log(`\nproduction now: ${await prod.category.count()} categories, ${await prod.product.count()} products, ${await prod.productImage.count()} images`);
    } else {
      console.log("\nDry run complete — nothing was written. Re-run with --apply.");
    }
  } finally {
    await dev.$disconnect();
    await prod.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
