import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
      "tests/integration/**/*.test.tsx",
    ],
    coverage: {
      provider: "v8",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "app-openlabel"),
      // fflate's "module" field points to the browser ESM build which behaves
      // differently in jsdom. Force the Node.js CJS build for tests.
      "fflate": path.resolve(__dirname, "node_modules/fflate/lib/index.cjs"),
    },
  },
});
