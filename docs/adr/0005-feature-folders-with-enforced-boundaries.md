# Code is organised by feature, with boundaries enforced by lint

Every app (native, web, server) is split into feature folders named after glossary terms. Each feature keeps its own screens, components, hooks, data access, i18n and private utils together. Features never import each other: route files and Home compose them, and cross-feature reactions travel over a typed event bus in `shared/` (for example SalahLogged → Companion XP). Code that more than one feature needs lives in `shared/` (utils, ui, lib) and may never import a feature. We chose this so each feature can be built, tested and changed on its own, often by an agent working in one fresh context.

## Layout

- App feature folder: `features/<feature>/` holding `screens/`, `components/`, `hooks/`, `data/` (repository and query hooks only), `i18n/` (ar, en) and `utils/`, with `index.ts` as the only public entry point. Empty subfolders are omitted.
- Pure rules stay in the domain package, split per feature (`domain/<feature>`), plus `domain/shared` (for example Hijri math). A feature may import only its own `domain/<feature>` and `domain/shared`.
- Tables live per feature in `db-user/<feature>` and `db-content/<feature>`, with one migrations folder per package. The device and the server, which migrates each Believer's new database, share them. A feature's `data/` imports only its own schema.
- oRPC contracts live per feature in `api/<feature>`. The server has `features/<feature>/` implementing them.
- Route files (expo-router `app/`, TanStack `routes/`) only render a feature's screen, or compose several on Home. They contain no logic.

## Enforcement

- oxlint `no-restricted-imports` rejects:
  - imports of another feature
  - deep imports of a feature's internals from outside it
  - `shared/` importing a feature
  - a feature importing another feature's domain, schema or contract
- dependency-cruiser checks the whole import graph in `uncheck` and CI.

## Considered Options

- Layer folders (components/, hooks/, services/ across the whole app): rejected. A single feature ends up spread across the tree.
- Features importing each other's `index.ts`: simpler, but it couples features to each other's public APIs.
- All pure logic and tables inside each app's feature folder: rejected. The server and the web need the same rules and schema, so they stay in packages, split per feature.
