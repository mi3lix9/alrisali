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
- Journeys that need credentials skip without them (the test's `skip` option): `sign-in-sync` needs `E2E_GOOGLE_EMAIL` and `E2E_GOOGLE_PASSWORD` (a Google test account without 2-Step Verification; `e2e.config.ts` declares it as the `google` credential, so the password is never logged); `admin-publish` needs `E2E_SERVER_URL` (the server the app talks to, its `EXPO_PUBLIC_SERVER_URL`) and `E2E_ADMIN_COOKIE` (the `cookie` header of a signed-in Admin's session on the web admin).
- Free the disk afterwards: `rm -rf apps/native/ios ~/Library/Developer/Xcode/DerivedData/alrsaly-*` (prebuild regenerates `ios/`).
- Metro writes `apps/native/.expo/types/router.d.ts`. After pulling new routes it goes stale and `bun run check` fails on unknown hrefs; delete `apps/native/.expo/types`.
- A failed test writes a trace page under `.e2e/results/<test>/trace.md` with the screen as the engine read it and a screenshot.

## Write a journey

1. One file per journey under `tests/web/` or `tests/native/`, named `<feature>.e2e.ts`. Import `test` from `@e2e-dev/web` or `@e2e-dev/mobile` and `expect` from `e2e`, and pin the test to its platform (`{ platforms: ["web"] }` or `{ platforms: ["ios"] }`), since every test runs on every target otherwise.
2. Locator steps only (`screen.getByRole/getByText/getByTestId`, `expect`). They need no model and no API key, locally or in CI. If a journey truly needs `agent.act`/`agent.assert`, add `agents` to `e2e.config.ts` with the model's key read from an env var, and make the test skip without it.
3. Native: give the controls the journey drives a `testID` (iOS reads it as the accessibility identifier): `<feature>-<thing>[-<id>]`, for example `prayer-log-tick-fajr`, `prayer-streak`. A plain `View` hides its children on iOS, so put the `testID` on the node you query, or make it `accessible` with an `accessibilityLabel` and assert `toHaveAccessibleName`.
4. Native: start each journey with `startAsNewGuest({ app, device, screen })` from `tests/native/support/journey.ts`: it reinstalls the app, resets the simulator keychain (SecureStore outlives an uninstall), sets the location to Najaf and walks the first run as a Guest, ending on Home. `installFresh` and `completeOnboarding(screen, account)` split it for a journey that signs in on the account step. Switch tabs with `openTab` (`tabs-<tab>` testIDs). The app launches in Arabic, so assert the Arabic catalogue's strings (`features/<feature>/i18n/ar.ts`).
5. The first launch waits for Metro to bundle: the helpers give the first check 180 s; give the test at least `JOURNEY_TIMEOUT`.

## Journeys

- `tests/web/landing.e2e.ts`: the Arabic landing page, its store links, the switch to English.
- `tests/native/prayer-log.e2e.ts`: onboarding as a Guest, logging today's five Salah on Home, the Prayer Streak tile reaching one day.
- `tests/native/insights.e2e.ts`: a new Guest opening Insights from Home and seeing an empty week.
- `tests/native/tasbih.e2e.ts`: a whole round of Tasbih al-Zahra (34 + 33 + 33 taps), step by step, ending in a saved Dhikr Session.
- `tests/native/programs.e2e.ts`: building six Personal Programs; the sixth Subscription is refused at the five-Program limit, with the reason.
- `tests/native/supplication.e2e.ts`: opening a Supplication from the Library's Books and marking it read today.
- `tests/native/quran-resume.e2e.ts`: starting the Quran from Home, jumping to page 50, leaving the reader and the app, and resuming at page 50.
- `tests/native/quran-search.e2e.ts`: searching `2:255` in the reader and landing on page 42.
- `tests/native/quran-play-to.e2e.ts`: long-pressing the first ayah of Al-Fatihah, Play To the end of the page, the mini player showing while it recites and going after the page's last ayah.
- `tests/native/companion.e2e.ts`: the Companion earning 10 XP for a logged Salah.
- `tests/native/qada.e2e.ts`: setting up a Qada Plan of ten days, logging a Qada Fajr from the Prayer Log, and the dashboard showing one fewer Fajr left.
- `tests/native/khatmah.e2e.ts`: starting the suggested 30-day Khatmah, completing today's portion from the sheet of the ayah where it ends, and the Khatmah moving on to the next session.
- `tests/native/sign-in-sync.e2e.ts` (Google credentials): a Guest's Open Tasbih comes back on a new device after signing in to the same account.
- `tests/native/admin-publish.e2e.ts` (Admin session): an Official Program an Admin publishes shows on a running device after its next launch.
- `tests/native/at-time-alert.e2e.ts`: opening Maghrib's At-Time Alert from the Prayer timetable, seeing the full adhan disabled while no recording is installed, testing the takbir, saving a silent notification and finding it kept.
