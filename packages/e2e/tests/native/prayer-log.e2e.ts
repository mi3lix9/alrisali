import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

// First journey (ticket 49): a new Believer opens the app as a Guest, logs
// today's Salah from Home and sees the Prayer Streak start.
//
// The app launches in Arabic (the default language), so the expected strings
// are the Arabic catalogue's. The Prayer Streak counts a day only once all
// five Salah are logged, so it reads 0 until Isha is ticked.

const SALAH = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

/** Najaf: Prayer Times needs a location to render Home's cards. */
const NAJAF = { latitude: 32.0283, longitude: 44.3398 };

test(
  "a Guest logs today's five Salah and starts a Prayer Streak",
  { platforms: ["ios"], timeout: 300_000 },
  async ({ app, device, screen }) => {
    // A fresh install is a fresh Guest: no account, an empty Prayer Log.
    await device.installApp(undefined, { reinstall: true });
    await device.setLocation(NAJAF);
    await app.open();

    // Every feature is open to a Guest: Home shows the Prayer Log, no
    // sign-in wall. The first launch waits for Metro to bundle the app.
    await expect(screen.getByText("سجل الصلاة")).toBeVisible({
      timeout: 180_000,
    });

    // The Prayer Log card sits below the fold on Home.
    const streak = screen.getByTestId("prayer-streak");
    await screen.scrollUntilVisible(streak, { direction: "down" });
    await expect(streak).toHaveAccessibleName("سلسلة الصلاة: 0 يوم");

    // One tap at a time: each is a gesture on the device, in order.
    /* oxlint-disable no-await-in-loop */
    for (const salah of SALAH) {
      const tick = screen.getByTestId(`prayer-log-tick-${salah}`);
      await expect(tick).not.toBeSelected();
      await tick.tap();
      await expect(tick).toBeSelected();
    }
    /* oxlint-enable no-await-in-loop */

    await expect(streak).toHaveAccessibleName("سلسلة الصلاة: يوم واحد");

    // The Account screen confirms the Believer is still a Guest.
    await screen.getByRole("button", "الحساب").tap();
    await expect(screen.getByText("أنت تستخدم التطبيق ضيفًا")).toBeVisible();
  }
);
