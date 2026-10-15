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

`.github/workflows/e2e.yml` runs the end-to-end journeys in `packages/e2e` (tester.army e2e): the web journeys on Ubuntu and the iOS journeys on a macOS runner against a simulator dev build. See [packages/e2e/README.md](packages/e2e/README.md) for running them locally and adding a journey.

### macOS runners (native jobs)

Native iOS jobs (simulator builds, the iOS e2e journeys, local release builds) run on Apple-silicon macOS runners and need:

- The Xcode version the app targets (currently Xcode 27).
- The **Metal Toolchain**. Xcode 27 does not ship it, and `react-native-vision-camera-resizer` compiles `.metal` shaders, so the build fails with `cannot execute tool 'metal' due to missing Metal Toolchain` without it. Install it once per image (about 840 MB):

  ```sh
  xcodebuild -downloadComponent MetalToolchain
  ```

  Cache it, or bake it into the runner image, because it is large. EAS macOS build images need the same component. See [docs/rebuild/spikes/prayer-assistant.md](docs/rebuild/spikes/prayer-assistant.md).

- An arm64 simulator build (`ARCHS=arm64`): the Turso sync xcframework ships no x86_64 simulator slice, so a universal simulator build fails to link (`framework 'turso-sync-sdk-kit' not found`).

## Monitoring

Sentry captures errors from all three apps. Each turns on only when its DSN is set:

| App | Variable | Forced test error (outside production) |
| --- | --- | --- |
| server | `SENTRY_DSN` | `GET /debug/sentry` |
| web | `VITE_SENTRY_DSN` | open `/debug/sentry`, press "Throw test error" |
| native | `EXPO_PUBLIC_SENTRY_DSN` | open `alrisali://debug-sentry`, press "Throw test error" |

The server reports unexpected errors only; oRPC errors below 500 (`UNAUTHORIZED`, `NOT_FOUND` and the like) are expected and are not sent. Native release builds upload source maps and debug symbols when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are set at build time, and skip the upload otherwise.

## Sign-in

Believers sign in with the native Apple (iOS) and Google sheets; the app sends the sheet's ID token to better-auth (`authClient.signIn.social({ provider, idToken })`) and keeps the session in SecureStore. Admins sign in to the web with the same providers through the OAuth redirect, so an Admin has one account on the phone and the web; the sign-in page shows a button for each provider the server has web credentials for (`account.signInOptions`).

For local development and test accounts, email and password sign-in and sign-up sit under the Apple and Google buttons on the app's account screen and the admin web sign-in page. `AUTH_DEV_EMAIL_PASSWORD` turns it on; unset, it is on outside production and off in production, and the server refuses to start with it set to true in production. The app shows the form in development builds, or when the server reports it on.

Deleting an account revokes the Believer's Sign in with Apple (Apple's REST `auth/revoke`): the app shows Apple's sheet once more for a fresh authorization code, which the server exchanges for the token it revokes. Without the Apple key the server skips the revocation and logs a warning.

| Variable | Where | Value |
| --- | --- | --- |
| `GOOGLE_CLIENT_IDS` | server | Comma-separated Google OAuth client IDs whose ID tokens are accepted: the web client ID first (the Admin web uses it), then the iOS and Android ones |
| `AUTH_DEV_EMAIL_PASSWORD` | server | Email and password sign-in for local development (default: on outside production; never in production) |
| `GOOGLE_CLIENT_SECRET` | server | The web client's secret; turns on the Admin web's Google sign-in |
| `APPLE_BUNDLE_IDS` | server | The app's bundle IDs (defaults to `com.alrisali.app,com.alrisali.app.dev`) |
| `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | server | The Sign in with Apple key (.p8): token revocation on account deletion, and the Admin web's Apple sign-in |
| `APPLE_WEB_SERVICES_ID` | server | The Services ID of the Admin web's Sign in with Apple (needs the Apple key) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | native | The Google web client ID, passed as `webClientId` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | native | The Google iOS client ID; `app.config.ts` derives the iOS URL scheme from it |

Google Cloud Console needs a web client, an iOS client for each bundle ID, and an Android client per package name and signing SHA-1. The Apple Developer account needs the Sign in with Apple capability on each App ID. Native sign-in needs a dev build (not Expo Go). Signing out asks for confirmation, then emits `SignedOut` on the event bus; the device database wipes itself on that event.

## Deploy

### Railway (server and web)

One Railway project with two services built from this repository, a bucket for over-the-air updates, and the Turso server database outside Railway.

| Service | Root directory | Config file                 | Branch |
| ------- | -------------- | --------------------------- | ------ |
| server  | `/`            | `/apps/server/railway.json` | `main` |
| web     | `/`            | `/apps/web/railway.json`    | `main` |

Both build with Railpack (`bun install`, then `turbo run build --filter=<app>`) and check `/` before taking traffic. The server's pre-deploy step (`bun run --cwd apps/server deploy:migrate`) applies the server database migrations, then `ota:prepare`: Hot Updater's schema settings and the app's client API key. The web runs TanStack Start's build with `srvx` (`apps/web` `start`).

Set `NODE_ENV=production` on both services, every variable in `apps/server/.env.schema` on the server, and every variable in `apps/web/.env.schema` on the web (`VITE_*` are read at build time). On the server, point `HOT_UPDATER_BUCKET`, `HOT_UPDATER_BUCKET_ENDPOINT`, `HOT_UPDATER_BUCKET_REGION`, `HOT_UPDATER_BUCKET_ACCESS_KEY_ID` and `HOT_UPDATER_BUCKET_SECRET_ACCESS_KEY` at the bucket's `BUCKET`, `ENDPOINT`, `REGION`, `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` with reference variables (`${{ota-bundles.BUCKET}}`). Generate the two Hot Updater keys once:

```sh
openssl rand -hex 32                              # HOT_UPDATER_ADMIN_TOKEN (server, and the deploy machine)
openssl rand -base64 32 | tr '+/' '-_' | tr -d =  # HOT_UPDATER_CLIENT_API_KEY (server) = EXPO_PUBLIC_HOT_UPDATER_API_KEY (EAS)
```

### EAS (native builds)

`apps/native/eas.json` has two build profiles. `APP_VARIANT` picks the bundle id and the Hot Updater channel:

| Profile | Bundle id / package | OTA channel | Distribution |
| --- | --- | --- | --- |
| `development` | `com.alrisali.app.dev` | `development` | internal (dev client) |
| `production` | `com.alrisali.app` | `production` | store, build number auto-incremented remotely |

Once: `eas init` in `apps/native`, then set `EAS_PROJECT_ID` (in the shell and as an EAS variable). Each EAS environment (`development`, `production`) needs the `EXPO_PUBLIC_*` variables from `apps/native/.env.schema` (production also needs `EXPO_PUBLIC_HOT_UPDATER_API_KEY`), plus the Sentry build variables.

```sh
cd apps/native
eas build --profile development --platform ios
eas build --profile production --platform all
eas submit --profile production --platform ios     # Android goes to the internal track as a draft
```

### Over-the-air updates (Hot Updater)

Release builds check the server's `/hot-updater` routes at launch, download a matching update in the background, and apply it on the next launch (a release marked force-update reloads at once). Updates match by app version (`updateStrategy: "appVersion"`), so a change to native code needs a new store build instead.

Deploy from `apps/native`, with `EXPO_PUBLIC_SERVER_URL` and the `HOT_UPDATER_*` bucket variables and admin token set (in `apps/native/.env` or the shell):

```sh
bun run ota:deploy -p ios -c production -t 1.0.x
bun run ota:deploy -p android -c production -t 1.0.x
```

`hot-updater bundle list`, `hot-updater console` and the other CLI commands use the same configuration (`apps/native/hot-updater.config.ts`). After upgrading Hot Updater, run `bun run --cwd apps/server ota:schema`, then `bun run db:generate`, and keep the two sides' versions equal.

## License

Code: [MIT](LICENSE). Bundled content keeps its own licences.
