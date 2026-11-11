import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup-isolated-data.ts"],
    env: { SHOREMIGO_DATA_DIR: path.resolve(__dirname, ".data-test"), SESSION_SECRET: "test-secret-0123456789" },
  },
});
