import "dotenv/config";
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
  const total = await prisma.newsletterSubscriber.count();
  const bySource = await prisma.newsletterSubscriber.groupBy({
    by: ["source"],
    _count: { _all: true },
  });
  const target = await prisma.newsletterSubscriber.count({ where: SEEDED });
  const survivors = await prisma.newsletterSubscriber.findMany({
    where: { NOT: SEEDED },
    select: { email: true, source: true, subscribedAt: true },
    orderBy: { subscribedAt: "desc" },
  });

  console.log(`total rows:        ${total}`);
  console.log(`by source:         ${bySource.map((s) => `${s.source}=${s._count._all}`).join(", ")}`);
  console.log(`delete target:     ${target}  (source='seed' OR email ends @berrymail.test)`);
  console.log(`would survive:     ${survivors.length}`);
  for (const s of survivors) {
    console.log(`  KEEP  ${s.email}  [${s.source}]  ${s.subscribedAt.toISOString().slice(0, 10)}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
