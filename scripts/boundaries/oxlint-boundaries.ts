// Feature-boundary rules for oxlint's `no-restricted-imports` (ADR-0005).
//
// oxlint matches import specifiers as text and cannot say "any feature but
// the importer's own", so this reads the feature folders on disk and emits one
// override per area: the whole app, its shared/, each app feature, and each
// feature folder of the per-feature packages. A later override replaces an
// earlier one's options, so every override carries its complete pattern list.
// dependency-cruiser (.dependency-cruiser.cjs) checks the resolved graph too.

import { existsSync, readdirSync } from "node:fs";

interface Pattern {
  regex: string;
  message: string;
}

interface Override {
  files: string[];
  rules: { "no-restricted-imports": ["error", { patterns: Pattern[] }] };
}

/** Where each app keeps `features/` and `shared/`. */
const APP_ROOTS = ["apps/native", "apps/web/src", "apps/server/src"];

/** Packages split into one `src/<feature>/` folder per feature. */
const FEATURE_PACKAGES = ["domain", "api", "db-user", "db-content"];

const SHARED = "shared";
const ADR = "See docs/adr/0005-feature-folders-with-enforced-boundaries.md.";

const subfolders = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];

const escape = (name: string): string =>
  name.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);

const oneOf = (names: string[]): string => `(?:${names.map(escape).join("|")})`;

/** Web admin features (admin-programs) own the package feature `programs`. */
const packageFeatureOf = (appFeature: string): string =>
  appFeature.replace(/^admin-/u, "");

const PACKAGE = oneOf(FEATURE_PACKAGES);

const appFeatures = new Map(
  APP_ROOTS.map((root) => [root, subfolders(`${root}/features`)])
);
const packageFeatures = new Map(
  FEATURE_PACKAGES.map((pkg) => [
    pkg,
    subfolders(`packages/${pkg}/src`).filter((name) => name !== SHARED),
  ])
);

/** Every feature name a package subpath could carry. */
const allFeatureNames = [
  ...new Set([
    ...[...appFeatures.values()].flat().map(packageFeatureOf),
    ...[...packageFeatures.values()].flat(),
  ]),
].filter((name) => name !== SHARED);

/** Patterns that only apply when there is a name to match. */
const whenAny = (names: string[], build: (names: string) => Pattern) =>
  names.length > 0 ? [build(oneOf(names))] : [];

const noPackageInternals: Pattern = {
  regex: `^@alrisali/${PACKAGE}/[^/]+/.`,
  message: `Import a package feature through its subpath (@alrisali/<package>/<feature>), never its files. ${ADR}`,
};

const noDeepFeatureImport: Pattern = {
  regex: "^@/features/[^/]+/.",
  message: `Import a feature only through its index (@/features/<feature>), never its internals. ${ADR}`,
};

const noRelativeFeatureImport: Pattern = {
  regex: String.raw`^\.{1,2}/(?:\.\./)*features(?:/|$)`,
  message: `Import a feature as @/features/<feature>, not by a relative path. ${ADR}`,
};

const restrict = (files: string[], patterns: Pattern[]): Override => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns }] },
});

const appOverrides = (root: string): Override[] => {
  const features = appFeatures.get(root) ?? [];

  const whole = restrict(
    [`${root}/**`],
    [noPackageInternals, noDeepFeatureImport, noRelativeFeatureImport]
  );

  const shared = restrict(
    [`${root}/${SHARED}/**`],
    [
      noPackageInternals,
      {
        regex: "^@/features(?:/|$)",
        message: `shared/ never imports a feature; pass feature UI in from a route, or emit an event. ${ADR}`,
      },
      {
        regex: String.raw`^\.{1,2}/(?:\.\./)*features(?:/|$)`,
        message: `shared/ never imports a feature. ${ADR}`,
      },
      ...whenAny(allFeatureNames, (names) => ({
        regex: `^@alrisali/${PACKAGE}/${names}(?:/|$)`,
        message: `shared/ may import only the shared subpath of a package (@alrisali/<package>/shared). ${ADR}`,
      })),
    ]
  );

  const perFeature = features.map((feature) => {
    const own = packageFeatureOf(feature);
    return restrict(
      [`${root}/features/${feature}/**`],
      [
        noPackageInternals,
        {
          regex: "^@/features(?:/|$)",
          message: `A feature never imports another feature: compose them in a route, or emit an event on the shared event bus. Inside a feature, use relative imports. ${ADR}`,
        },
        {
          regex: String.raw`^(?:\.\./)+features(?:/|$)`,
          message: `A feature never imports another feature. ${ADR}`,
        },
        ...whenAny(
          features.filter((other) => other !== feature),
          (names) => ({
            regex: String.raw`^(?:\.\./)+${names}(?:/|$)`,
            message: `A feature never imports another feature. ${ADR}`,
          })
        ),
        ...whenAny(
          allFeatureNames.filter((name) => name !== own),
          (names) => ({
            regex: `^@alrisali/${PACKAGE}/${names}(?:/|$)`,
            message: `A feature imports only its own domain, schema and contract (@alrisali/<package>/${own}) and the shared subpath. ${ADR}`,
          })
        ),
        {
          regex: "^@alrisali/api$",
          message: `A feature calls the API through the shared oRPC client, not the whole contract. ${ADR}`,
        },
      ]
    );
  });

  return [whole, shared, ...perFeature];
};

const packageOverrides = (pkg: string): Override[] => {
  const features = packageFeatures.get(pkg) ?? [];

  const shared = restrict(
    [`packages/${pkg}/src/${SHARED}/**`],
    [
      noPackageInternals,
      ...whenAny(features, (names) => ({
        regex: String.raw`^(?:\.\./)+${names}(?:/|$)`,
        message: `A package's shared/ never imports one of its features. ${ADR}`,
      })),
      ...whenAny(allFeatureNames, (names) => ({
        regex: `^@alrisali/${PACKAGE}/${names}(?:/|$)`,
        message: `A package's shared/ never imports a feature subpath. ${ADR}`,
      })),
    ]
  );

  const perFeature = features.map((feature) =>
    restrict(
      [`packages/${pkg}/src/${feature}/**`],
      [
        noPackageInternals,
        ...whenAny(
          features.filter((other) => other !== feature),
          (names) => ({
            regex: String.raw`^(?:\.\./)+${names}(?:/|$)`,
            message: `A package feature imports only itself and ../shared. ${ADR}`,
          })
        ),
        ...whenAny(
          allFeatureNames.filter((name) => name !== feature),
          (names) => ({
            regex: `^@alrisali/${PACKAGE}/${names}(?:/|$)`,
            message: `A feature imports only its own domain, schema and contract and the shared subpath. ${ADR}`,
          })
        ),
      ]
    )
  );

  return [shared, ...perFeature];
};

/** Overrides for oxlint.config.ts, ordered so the narrowest area wins. */
export const boundaryOverrides: Override[] = [
  restrict(["**"], [noPackageInternals]),
  ...APP_ROOTS.flatMap(appOverrides),
  ...FEATURE_PACKAGES.flatMap(packageOverrides),
];
