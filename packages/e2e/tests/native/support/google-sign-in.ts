import { setTimeout as sleep } from "node:timers/promises";

import type { Device } from "@e2e-dev/mobile";
import { credentials } from "e2e";
import type { Locator, Screen } from "e2e";

// Signing in with Google drives Google's own sheet, so the journeys that sign
// in need a real Google account: `E2E_GOOGLE_EMAIL` and `E2E_GOOGLE_PASSWORD`
// (an account without 2-Step Verification). `e2e.config.ts` declares them as
// the `google` credential only when both are set; the password stays an
// opaque secret the runner fills itself.

/** The credential `e2e.config.ts` declares from the environment. */
export const GOOGLE_CREDENTIAL = "google";

/** Why a Google journey is skipped, or false when it can run. */
export const googleSkipReason: string | false =
  process.env.E2E_GOOGLE_EMAIL && process.env.E2E_GOOGLE_PASSWORD
    ? false
    : "needs E2E_GOOGLE_EMAIL and E2E_GOOGLE_PASSWORD (a Google test account)";

/** How long Google's sheet may take to load each page. */
const SHEET_TIMEOUT = 60_000;
const POLL_MS = 1000;

/**
 * Waits until one of `locators` shows and returns its index. Polled in turn,
 * so the device answers one query at a time.
 */
const firstVisible = async (
  locators: readonly Locator[],
  timeout: number
): Promise<number> => {
  const deadline = Date.now() + timeout;
  /* oxlint-disable no-await-in-loop */
  while (Date.now() < deadline) {
    for (const [index, locator] of locators.entries()) {
      if (await locator.isVisible()) {
        return index;
      }
    }
    await sleep(POLL_MS);
  }
  /* oxlint-enable no-await-in-loop */
  throw new Error("Google's sign-in sheet showed neither field nor account");
};

/**
 * Signs in with the Google button on screen (`account-google-sign-in`, on the
 * Account screen or the first run's account step). iOS first asks to let the
 * app use google.com to sign in; Google then asks for the email and password,
 * or offers the account it remembers from an earlier run.
 */
export const signInWithGoogle = async (
  screen: Screen,
  device: Device
): Promise<void> => {
  const google = credentials.user(GOOGLE_CREDENTIAL);

  await screen.getByTestId("account-google-sign-in").tap();
  await device.alert("accept");

  const emailField = screen.getByRole("textbox");
  const rememberedAccount = screen.getByText(google.username);
  const shown = await firstVisible(
    [emailField, rememberedAccount],
    SHEET_TIMEOUT
  );
  if (shown === 1) {
    await rememberedAccount.tap();
    return;
  }

  await emailField.fill(google.username);
  await emailField.press("Enter");
  // The password page has the one text field left.
  const passwordField = screen.getByRole("textbox");
  await passwordField.waitFor({ timeout: SHEET_TIMEOUT });
  await passwordField.fill(google.password);
  await passwordField.press("Enter");
};
