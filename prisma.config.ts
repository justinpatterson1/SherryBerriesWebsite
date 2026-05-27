import "dotenv/config";
import { defineConfig } from "prisma/config";

// We deliberately use process.env (not Prisma's strict `env()` helper) so
// `prisma generate` works during initial setup before a Neon connection
// string has been pasted into .env. `prisma migrate` will still fail loudly
// against the placeholder, which is the desired guardrail.
const url =
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url,
  },
});
