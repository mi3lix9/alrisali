# @alrisali/e2e

End-to-end journeys with [tester.army e2e](https://e2e.tester.army/docs): the web app in Chromium and the native app on an iOS simulator. CI runs them in `.github/workflows/e2e.yml`.

| Target | Engine | App under test | Started by the runner |
| --- | --- | --- | --- |
| `web` | `@e2e-dev/web` (Chromium) | `apps/web` dev server on a free port | `bun run dev` in `apps/web` |
| `ios` | `@e2e-dev/mobile` (agent-device, `iPhone 17`) | Debug simulator build of `apps/native` (`com.alrisali.app.dev`) | Metro (`bun run start --port 8081`) in `apps/native` |

## Run locally

Node 24.8 or newer. From this folder:

```sh
bun run e2e:web              # first run downloads Chromium
bun run build:ios            # once per native change: prebuild + arm64 simulator Debug build (~5-6 GB)
bun run e2e:ios              # boots the simulator, starts Metro, runs the iOS journeys
bunx e2e run tests/native/prayer-log.e2e.ts --target ios   # one file
```

- The iOS build reads `apps/native/.env` (prebuild needs `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`). Change JavaScript only and Metro serves it; rebuild only after native changes (a new native module, `app.config.ts`).
- `E2E_IOS_APP_PATH` points at another `.app`; `E2E_IOS_DEVICE` picks another simulator.
- Free the disk afterwards: `rm -rf apps/native/ios ~/Library/Developer/Xcode/DerivedData/alrsaly-*` (prebuild regenerates `ios/`).
- Metro writes `apps/native/.expo/types/router.d.ts`. After pulling new routes it goes stale and `bun run check` fails on unknown hrefs; delete `apps/native/.expo/types`.
- A failed test writes a trace page under `.e2e/results/<test>/trace.md` with the screen as the engine read it and a screenshot.

## Write a journey

1. One file per journey under `tests/web/` or `tests/native/`, named `<feature>.e2e.ts`. Import `test` from `@e2e-dev/web` or `@e2e-dev/mobile` and `expect` from `e2e`, and pin the test to its platform (`{ platforms: ["web"] }` or `{ platforms: ["ios"] }`), since every test runs on every target otherwise.
2. Locator steps only (`screen.getByRole/getByText/getByTestId`, `expect`). They need no model and no API key, locally or in CI. If a journey truly needs `agent.act`/`agent.assert`, add `agents` to `e2e.config.ts` with the model's key read from an env var, and make the test skip without it.
3. Native: give the controls the journey drives a `testID` (iOS reads it as the accessibility identifier): `<feature>-<thing>[-<id>]`, for example `prayer-log-tick-fajr`, `prayer-streak`. A plain `View` hides its children on iOS, so put the `testID` on the node you query, or make it `accessible` with an `accessibilityLabel` and assert `toHaveAccessibleName`.
4. Native: start each journey with `device.installApp(undefined, { reinstall: true })` and `app.open()` so it starts as a new Guest, then set what it needs (`device.setLocation`, permissions in the config). The app launches in Arabic, so assert the Arabic catalogue's strings (`features/<feature>/i18n/ar.ts`).
5. Give the first native check `timeout: 180_000`: the first launch waits for Metro to bundle.

## Journeys

- `tests/web/landing.e2e.ts`: the Arabic landing page, its store links, the switch to English.
- `tests/native/prayer-log.e2e.ts`: onboarding as a Guest, logging today's five Salah on Home, the Prayer Streak reaching one day.
- `tests/native/insights.e2e.ts`: a new Guest opening Insights from Home and seeing an empty week.
