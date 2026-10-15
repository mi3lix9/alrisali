import type { Device } from "@e2e-dev/mobile";
import { expect } from "e2e";
import type { App, Screen } from "e2e";

// Steps every native journey shares: a fresh install, the first run as a
// Guest, and moving between tabs. The app launches in Arabic, so the strings
// are the Arabic catalogue's (`features/<feature>/i18n/ar.ts`).

/** Najaf: Prayer Times needs a location to render Home's cards. */
export const NAJAF = { latitude: 32.0283, longitude: 44.3398 };

/** The first launch waits for Metro to bundle the app. */
export const FIRST_LAUNCH_TIMEOUT = 180_000;

/** A journey's test timeout: the first launch alone may take three minutes. */
export const JOURNEY_TIMEOUT = 300_000;

/** The onboarding steps after the language, by their titles, in order. */
const SETTING_STEPS = ["طريقة الحساب", "أسلوب الرسائل", "التنبيهات"] as const;

/**
 * Installs the build afresh and opens it: a new device with no records. The
 * iOS keychain outlives an uninstall, and SecureStore keeps the first-run
 * progress, the preferences and the session there, so it is reset too.
 */
export const installFresh = async ({
  app,
  device,
}: {
  app: App;
  device: Device;
}): Promise<void> => {
  await device.installApp(undefined, { reinstall: true });
  await device.clearKeychain();
  await device.setLocation(NAJAF);
  await app.open();
};

/**
 * Walks the first run: Arabic, the device's location, the default
 * Calculation Method and Message Style, no notification prompt, then the
 * account step. `account` acts on that step (signs in); without it the
 * Believer continues as a Guest. Ends on Home.
 */
export const completeOnboarding = async (
  screen: Screen,
  account?: () => Promise<void>
): Promise<void> => {
  const title = screen.getByTestId("onboarding-title");
  const next = screen.getByTestId("onboarding-continue");

  await expect(title).toHaveText("أهلًا بك في الرسالي", {
    timeout: FIRST_LAUNCH_TIMEOUT,
  });
  // Arabic is already chosen, so continuing does not relaunch the app.
  await next.tap();

  await expect(title).toHaveText("موقعك");
  await screen.getByTestId("prayer-times-locate").tap();
  // The step offers "Skip" until a location is saved.
  await expect(next).toHaveAccessibleName("متابعة");
  await next.tap();

  // One step at a time: each tap shows the next step's title.
  /* oxlint-disable no-await-in-loop */
  for (const step of SETTING_STEPS) {
    await expect(title).toHaveText(step);
    await next.tap();
  }
  /* oxlint-enable no-await-in-loop */

  await expect(title).toHaveText("حفظ بياناتك");
  await (account ? account() : screen.getByTestId("onboarding-guest").tap());

  // Home: the Prayer Streak tile heads the widget grid.
  await expect(screen.getByTestId("prayer-streak")).toBeVisible();
};

/** A new Believer on a fresh install who finishes the first run as a Guest. */
export const startAsNewGuest = async ({
  app,
  device,
  screen,
}: {
  app: App;
  device: Device;
  screen: Screen;
}): Promise<void> => {
  await installFresh({ app, device });
  await completeOnboarding(screen);
};

export type Tab = "home" | "prayer" | "library" | "worship" | "tasbih";

/** Switches to a tab of the tab bar. */
export const openTab = async (screen: Screen, tab: Tab): Promise<void> => {
  await screen.getByTestId(`tabs-${tab}`).tap();
};
