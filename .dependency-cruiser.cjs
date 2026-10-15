// @ts-check
// Feature boundaries over the resolved import graph (ADR-0005). oxlint's
// no-restricted-imports (scripts/boundaries/oxlint-boundaries.ts) catches the
// same violations by import text; this catches them however the path is
// spelled. Run by `bun run check:boundaries`, part of `bun run check`.
//
// Apps keep features in `apps/<app>/[src/]features/<feature>/` and shared code
// in `apps/<app>/[src/]shared/`. The per-feature packages keep one folder per
// feature in `packages/<package>/src/<feature>/`, plus `src/shared/`.

const APP_FEATURES = String.raw`^apps/[^/]+/(?:src/)?features/`;
const PACKAGE = "(?:domain|api|db-user|db-content)";
const PACKAGE_FEATURE = `^packages/${PACKAGE}/src/[^/]+/`;
const ADR = "See docs/adr/0005-feature-folders-with-enforced-boundaries.md.";

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "feature-imports-feature",
      comment: `A feature never imports another feature: compose them in a route, or emit an event on the shared event bus. ${ADR}`,
      severity: "error",
      from: { path: String.raw`^apps/([^/]+)/(?:src/)?features/([^/]+)/` },
      to: {
        path: String.raw`^apps/$1/(?:src/)?features/`,
        pathNot: String.raw`^apps/$1/(?:src/)?features/$2/`,
      },
    },
    {
      name: "deep-import-into-feature",
      comment: `Outside a feature, import it only through its index.ts. ${ADR}`,
      severity: "error",
      from: { path: "^apps/", pathNot: APP_FEATURES },
      to: {
        path: `${APP_FEATURES}[^/]+/.`,
        pathNot: String.raw`${APP_FEATURES}[^/]+/index\.tsx?$`,
      },
    },
    {
      name: "shared-imports-feature",
      comment: `shared/ never imports a feature. ${ADR}`,
      severity: "error",
      from: { path: String.raw`^apps/([^/]+)/(?:src/)?shared/` },
      to: { path: String.raw`^apps/$1/(?:src/)?features/` },
    },
    {
      name: "shared-imports-package-feature",
      comment: `shared/ may import only the shared subpath of a per-feature package. ${ADR}`,
      severity: "error",
      from: { path: String.raw`^apps/[^/]+/(?:src/)?shared/` },
      to: {
        path: PACKAGE_FEATURE,
        pathNot: `^packages/${PACKAGE}/src/shared/`,
      },
    },
    {
      name: "feature-imports-other-package-feature",
      comment: `A feature imports only its own domain, schema and contract, plus the shared subpath. Web admin-<x> features own <x>. ${ADR}`,
      severity: "error",
      from: {
        path: String.raw`^apps/[^/]+/(?:src/)?features/(?:admin-)?([^/]+)/`,
      },
      to: {
        path: PACKAGE_FEATURE,
        pathNot: `^packages/${PACKAGE}/src/(?:$1|shared)/`,
      },
    },
    {
      name: "feature-imports-whole-contract",
      comment: `A feature calls the API through the shared oRPC client, not the whole contract. ${ADR}`,
      severity: "error",
      from: { path: APP_FEATURES },
      to: { path: String.raw`^packages/api/src/index\.ts$` },
    },
    {
      name: "package-feature-imports-other-feature",
      comment: `A package feature imports only itself and shared; a package's shared imports no feature. ${ADR}`,
      severity: "error",
      from: { path: `^packages/${PACKAGE}/src/([^/]+)/` },
      to: {
        path: PACKAGE_FEATURE,
        pathNot: `^packages/${PACKAGE}/src/(?:$1|shared)/`,
      },
    },
    {
      name: "deep-import-into-package-feature",
      comment: `Import a package feature through its subpath (@alrisali/<package>/<feature>), never its files. ${ADR}`,
      severity: "error",
      from: { path: "^(?:apps|packages)/([^/]+)/" },
      to: {
        path: `${PACKAGE_FEATURE}.`,
        pathNot: [
          "^packages/$1/src/",
          String.raw`^packages/[^/]+/src/[^/]+/index\.ts$`,
        ],
      },
    },
    {
      name: "no-circular",
      comment: "No dependency cycles.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: [
        "node_modules",
        String.raw`(?:^|/)\.expo/`,
        "(?:^|/)dist/",
        String.raw`routeTree\.gen\.ts$`,
      ],
    },
    // `import type` edges count: a contract is crossed as much by its types.
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      // Workspace packages expose per-feature subpaths through `exports`.
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    // Resolves each app's `@/` alias; see the file for why it is a plugin.
    webpackConfig: { fileName: "scripts/boundaries/depcruise-resolve.cjs" },
  },
};
