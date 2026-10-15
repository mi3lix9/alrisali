import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";
import vitest from "ultracite/oxlint/vitest";

import { boundaryOverrides } from "./scripts/boundaries/oxlint-boundaries.ts";

export default defineConfig({
  ...(core.env ? { env: core.env } : {}),
  extends: [core, react, tanstack, vitest],
  // Vendored agent skills (npx skills add) keep upstream bytes.
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    ".agents/skills/**",
    ".claude/skills/**",
  ],
  rules: {
    // React Navigation and expo-router take render functions as options
    // (tabBarIcon, headerRight, drawerIcon).
    "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
  },
  overrides: [
    {
      // Metro and Babel load these synchronously as CommonJS.
      files: ["apps/native/babel.config.js", "apps/native/metro.config.js"],
      rules: {
        "node/global-require": "off",
        "unicorn/prefer-module": "off",
      },
    },
    // Feature folders and their boundaries (ADR-0005).
    ...boundaryOverrides,
  ],
});
