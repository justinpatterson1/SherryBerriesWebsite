/**
 * One-off: remove the faker-generated newsletter rows the seed wrote into the
 * production database (see open-issues.md #25).
 *
 * Matches on the @berrymail.test domain rather than `source = 'seed'` — the
 * rows already in production carry `source = null`, because they predate the
 * column's backfill. Every row is written to a JSON backup before deletion.
 *
 * Run: npx tsx scripts/newsletter-purge-seed.ts --apply
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: connectionString.replace(
      /([?&]sslmode=)(prefer|require|verify-ca)\b/i,
      "$1verify-full",
    ),
  }),
});

const SEEDED = {
  OR: [{ source: "seed" }, { email: { endsWith: "@berrymail.test" } }],
};

async function main() {
  const apply = process.argv.includes("--apply");
  const doomed = await prisma.newsletterSubscriber.findMany({ where: SEEDED });
  const survivors = await prisma.newsletterSubscriber.count({ where: { NOT: SEEDED } });

  console.log(`matched for deletion: ${doomed.length}`);
  console.log(`real subscribers kept: ${survivors}`);

  if (!apply) {
    console.log("\nDRY RUN — pass --apply to delete.");
    return;
  }

  const backup = `newsletter-seed-backup-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(backup, JSON.stringify(doomed, null, 2));
  console.log(`backup written: ${backup}`);

  const { count } = await prisma.newsletterSubscriber.deleteMany({ where: SEEDED });
  const after = await prisma.newsletterSubscriber.count();
  console.log(`deleted: ${count}`);
  console.log(`rows remaining: ${after}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
