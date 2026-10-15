import { mobile } from "@e2e-dev/mobile";
import { web } from "@e2e-dev/web";
import type { E2EConfig } from "e2e";

// Journeys run without a model: every step is a locator, so no API key is
// needed locally or in CI. Add `agents` here only when a journey needs
// `agent.*` steps (see README.md).

/** The development variant's bundle id (apps/native/app.config.ts). */
const IOS_BUNDLE_ID = "com.alrisali.app.dev";

/**
 * The Debug simulator build `bun run build:ios` writes. A Debug build loads
 * its JavaScript from Metro, which the ios target starts below.
 */
const IOS_APP_PATH =
  process.env.E2E_IOS_APP_PATH ??
  "../../apps/native/ios/build/Build/Products/Debug-iphonesimulator/alrsaly.app";

const METRO_PORT = "8081";

const { E2E_GOOGLE_EMAIL, E2E_GOOGLE_PASSWORD } = process.env;

export default {
  tests: "tests/**/*.e2e.ts",
  targets: [
    {
      name: "web",
      engine: web(),
      app: {
        // Port 0: the runner picks a free port, so a dev server already on
        // 3001 never collides with the run.
        url: "http://127.0.0.1:0",
        command: {
          executable: "bun",
          args: [
            "run",
            "dev",
            "--host",
            "127.0.0.1",
            "--port",
            "{port}",
            "--strictPort",
          ],
          cwd: "../../apps/web",
          inheritEnv: ["NODE_ENV", "VITE_*"],
          startupTimeout: 120_000,
          log: ".e2e/logs/web.log",
        },
      },
    },
    {
      name: "ios",
      engine: mobile({
        platform: "ios",
        device: process.env.E2E_IOS_DEVICE ?? "iPhone 17",
      }),
      app: {
        bundleId: IOS_BUNDLE_ID,
        appPath: IOS_APP_PATH,
        // Prayer Times asks for the location on Home; grant it up front so no
        // system prompt covers the screen.
        permissions: { location: "grant" },
        command: {
          executable: "bun",
          args: ["run", "start", "--port", METRO_PORT],
          cwd: "../../apps/native",
          env: { CI: "1" },
          inheritEnv: [
            "NODE_ENV",
            "APP_VARIANT",
            "EXPO_*",
            "SENTRY_*",
            "EAS_*",
          ],
          startupTimeout: 120_000,
          log: ".e2e/logs/metro.log",
        },
        readyUrl: `http://localhost:${METRO_PORT}/status`,
      },
    },
  ],
  workers: 1,
  // The Google test account the sign-in journeys use
  // (tests/native/support/google-sign-in.ts); they skip without it.
  ...(E2E_GOOGLE_EMAIL && E2E_GOOGLE_PASSWORD
    ? {
        credentials: {
          google: {
            username: E2E_GOOGLE_EMAIL,
            password: E2E_GOOGLE_PASSWORD,
          },
        },
      }
    : {}),
} satisfies E2EConfig;
