import { setTimeout as sleep } from "node:timers/promises";

import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { googleSkipReason, signInWithGoogle } from "./support/google-sign-in";
import {
  completeOnboarding,
  installFresh,
  JOURNEY_TIMEOUT,
  openTab,
  startAsNewGuest,
} from "./support/journey";

// Tickets 10 and 11: what a Guest records goes up to their cloud database
// when they sign in, and comes back on a new device that signs in to the
// same account. The record is an Open Tasbih with a name unique to this run,
// so an earlier run's data can never pass the check.
//
// Needs E2E_GOOGLE_EMAIL and E2E_GOOGLE_PASSWORD (skipped without them), and
// the app's server (EXPO_PUBLIC_SERVER_URL) with its sync host running.

/**
 * Sync has no on-screen state: it runs on sign-in and on every launch. This
 * is how long the old device is left running before it is wiped.
 */
const SYNC_SETTLE_MS = 15_000;

/** How long the new device may take to pull the account's records. */
const PULL_TIMEOUT = 60_000;

test(
  "a Guest signs in and their records come back on a new device",
  {
    platforms: ["ios"],
    timeout: JOURNEY_TIMEOUT * 2,
    skip: googleSkipReason,
  },
  async ({ app, device, screen }) => {
    const name = `ذكر ${crypto.randomUUID().slice(0, 8)}`;

    // A Guest records something on this device.
    await startAsNewGuest({ app, device, screen });
    await openTab(screen, "tasbih");
    await screen.getByTestId("tasbih-new").tap();
    await screen.getByTestId("tasbih-form-name").fill(name);
    await screen.getByTestId("tasbih-form-submit").tap();

    // Then signs in from the Account screen: the Guest's records go up.
    await openTab(screen, "home");
    await screen.getByRole("button", "الحساب").tap();
    await signInWithGoogle(screen, device);
    await expect(screen.getByText("مسجّل الدخول باسم")).toBeVisible({
      timeout: PULL_TIMEOUT,
    });
    await app.restart();
    await expect(screen.getByTestId("prayer-streak")).toBeVisible();
    await sleep(SYNC_SETTLE_MS);

    // A new device: the same account signs in during the first run.
    await installFresh({ app, device });
    await completeOnboarding(screen, () => signInWithGoogle(screen, device));

    await openTab(screen, "tasbih");
    await expect(screen.getByText(name)).toBeVisible({
      timeout: PULL_TIMEOUT,
    });
  }
);
