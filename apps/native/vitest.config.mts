import { defineProject } from "vitest/config";

// Pure modules under test may import `@/shared/...` the way the app does.
// `.mts` because the native package is not `"type": "module"`.
export default defineProject({
  resolve: {
    alias: { "@": import.meta.dirname },
  },
});
