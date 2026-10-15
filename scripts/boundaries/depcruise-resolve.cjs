// @ts-check
// Resolve options for dependency-cruiser (.dependency-cruiser.cjs loads this
// as its webpackConfig). Each app maps `@/` to a different folder, so neither
// one static alias nor a single --ts-config covers the whole repo in one
// cruise, and depcruise's own config schema does not accept resolver plugins.
/* oxlint-disable promise/prefer-await-to-callbacks -- enhanced-resolve hooks are callback-based */

const path = require("node:path");

/** What `@/*` maps to in each app's tsconfig.json `paths`. */
const APP_ALIAS_ROOTS = { native: ".", web: "src", server: "src" };

const APP_DIR = /^(?<dir>.*\/apps\/(?<app>[^/]+))(?:\/|$)/u;

/** Resolves `@/…` relative to the app the importing file lives in. */
const appAliasPlugin = {
  /** @param {any} resolver enhanced-resolve's Resolver */
  apply(resolver) {
    const target = resolver.ensureHook("resolve");
    resolver
      .getHook("described-resolve")
      .tapAsync("AppAliasPlugin", (request, context, callback) => {
        const groups = APP_DIR.exec(request.path ?? "")?.groups;
        const root = groups && APP_ALIAS_ROOTS[groups.app];
        if (!request.request?.startsWith("@/") || !groups || !root) {
          callback();
          return;
        }
        resolver.doResolve(
          target,
          {
            ...request,
            request: path.join(groups.dir, root, request.request.slice(2)),
          },
          `@/ alias of apps/${groups.app}`,
          context,
          callback
        );
      });
  },
};

module.exports = { resolve: { plugins: [appAliasPlugin] } };
