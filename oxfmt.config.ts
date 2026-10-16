import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  // Vendored agent skills (npx skills add): keep upstream bytes so `skills update` stays clean.
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    ".agents/skills/**",
    ".claude/skills/**",
    // Generated content bundles (packages/content scripts write them).
    "packages/content/src/*/data/**",
  ],
});
