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
bun run db:sync-server  # local tursodb --sync-server for Believers' databases (stands in for Turso Cloud)
bun run dev          # all apps
bun run check        # oxlint, oxfmt, tsc and sherif via uncheck
bun run check:fix
bun run test
```

The native app is a development build (not Expo Go). `APP_VARIANT=production` switches the bundle id from `com.alrisali.app.dev` to `com.alrisali.app`.

## CI

`.github/workflows/ci.yml` runs on every push and pull request: `bun run check` (uncheck: oxlint, oxfmt, tsc, sherif; then dependency-cruiser boundaries), `bun run test` (Vitest) and `bun run build`.

### macOS runners (native jobs)

Native iOS jobs (simulator builds, Maestro e2e, local release builds) run on macOS runners and need:

- The Xcode version the app targets (currently Xcode 27).
- The **Metal Toolchain**. Xcode 27 does not ship it, and `react-native-vision-camera-resizer` compiles `.metal` shaders, so the build fails with `cannot execute tool 'metal' due to missing Metal Toolchain` without it. Install it once per image (about 840 MB):

  ```sh
  xcodebuild -downloadComponent MetalToolchain
  ```

  Cache it, or bake it into the runner image, because it is large. EAS macOS build images need the same component. See [docs/rebuild/spikes/prayer-assistant.md](docs/rebuild/spikes/prayer-assistant.md).

## Monitoring

Sentry captures errors from all three apps. Each turns on only when its DSN is set:

| App | Variable | Forced test error (outside production) |
| --- | --- | --- |
| server | `SENTRY_DSN` | `GET /debug/sentry` |
| web | `VITE_SENTRY_DSN` | open `/debug/sentry`, press "Throw test error" |
| native | `EXPO_PUBLIC_SENTRY_DSN` | open `alrisali://debug-sentry`, press "Throw test error" |

The server reports unexpected errors only; oRPC errors below 500 (`UNAUTHORIZED`, `NOT_FOUND` and the like) are expected and are not sent. Native release builds upload source maps and debug symbols when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are set at build time, and skip the upload otherwise.

## Sign-in

Believers sign in with the native Apple (iOS) and Google sheets; the app sends the sheet's ID token to better-auth (`authClient.signIn.social({ provider, idToken })`) and keeps the session in SecureStore. Admins sign in to the web with email and password.

| Variable | Where | Value |
| --- | --- | --- |
| `GOOGLE_CLIENT_IDS` | server | Comma-separated Google OAuth client IDs whose ID tokens are accepted: the web client ID, plus the iOS and Android ones |
| `APPLE_BUNDLE_IDS` | server | The app's bundle IDs (defaults to `com.alrisali.app,com.alrisali.app.dev`) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | native | The Google web client ID, passed as `webClientId` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | native | The Google iOS client ID; `app.config.ts` derives the iOS URL scheme from it |

Google Cloud Console needs a web client, an iOS client for each bundle ID, and an Android client per package name and signing SHA-1. The Apple Developer account needs the Sign in with Apple capability on each App ID. Native sign-in needs a dev build (not Expo Go). Signing out asks for confirmation, then emits `SignedOut` on the event bus; the device database wipes itself on that event.

## License

Code: [MIT](LICENSE). Bundled content keeps its own licences.
