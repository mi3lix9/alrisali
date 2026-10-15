# الرسالي (Al-Risali)

A Shia Islamic companion app for iOS, Android and the web.

- Decisions and scope: [docs/rebuild/decisions.md](docs/rebuild/decisions.md)
- Architecture decisions: [docs/adr/](docs/adr/)
- Vocabulary: [GLOSSARY.md](GLOSSARY.md)

## Layout

```
apps/native       Expo app
apps/web          TanStack Start: landing + /admin
apps/server       Hono + Bun + oRPC
packages/domain   pure TypeScript domain logic
packages/api      oRPC contracts
packages/auth     better-auth config
packages/db-user | db-content | db-server   Drizzle schemas + migrations
packages/content  bundled Quran/books data
packages/i18n     ar/en catalogs
packages/config   shared tsconfig
packages/ui       shadcn/ui components for the web
packages/e2e      end-to-end tests
```

## Development

```sh
bun install
bun run db:local     # local SQLite (turso dev) for the server database
bun run dev          # all apps
bun run check        # oxlint, oxfmt, tsc and sherif via uncheck
bun run check:fix
bun run test
```

The native app is a development build (not Expo Go). `APP_VARIANT=production` switches the bundle id from `com.alrisali.app.dev` to `com.alrisali.app`.

## License

Code: [MIT](LICENSE). Bundled content keeps its own licences.
