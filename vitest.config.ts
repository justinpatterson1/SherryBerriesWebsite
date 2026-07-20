import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const stub = fileURLToPath(new URL("./test/empty-module.ts", import.meta.url));

export default defineConfig({
  test: {
    // Server actions + utilities only (no jsdom); components aren't unit-tested.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // `server-only`/`client-only` throw outside their runtime — stub them so
      // server modules under test import cleanly in Node.
      "server-only": stub,
      "client-only": stub,
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
