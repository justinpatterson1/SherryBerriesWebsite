import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Neon serves publicly-trusted certificates, so `verify-full` is the correct
// mode. pg treats `prefer`/`require`/`verify-ca` as aliases for `verify-full`
// today but warns that this will change in pg v9; make the mode explicit to
// keep current behavior and silence the deprecation warning.
function normalizeSslMode(connectionString: string) {
  return connectionString.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)\b/i,
    "$1verify-full",
  );
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env (Neon dev branch connection string).",
    );
  }
  const adapter = new PrismaPg({
    connectionString: normalizeSslMode(connectionString),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
