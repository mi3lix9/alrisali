import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/*",
      "!packages/e2e",
      "apps/server",
      "apps/native",
      "apps/web",
    ],
  },
});
