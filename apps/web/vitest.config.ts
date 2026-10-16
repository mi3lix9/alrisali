import { defineProject } from "vitest/config";

// Unit tests for the web app's pure helpers. Its own config keeps Vitest off
// vite.config.ts, whose TanStack Start and Varlock plugins tests do not need.
export default defineProject({
  test: { name: "web" },
});
