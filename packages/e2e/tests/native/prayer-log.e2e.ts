import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, startAsNewGuest } from "./support/journey";

// First journey (ticket 49): a new Believer goes through the first run as a
// Guest, logs today's Salah from Home's quick ticks and sees the Prayer
// Streak tile (ticket 41) start. The streak counts a day only once all five
// Salah are logged, so it reads 0 until Isha is ticked.

const SALAH = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

test(
  "a Guest logs today's five Salah and starts a Prayer Streak",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    // Every feature is open to a Guest: no sign-in wall after the first run.
    await startAsNewGuest({ app, device, screen });

    // The Prayer Streak tile heads Home's widget grid, beside today's date.
    const streak = screen.getByTestId("prayer-streak");
    await expect(streak).toHaveAccessibleName("سلسلة الصلاة: 0 يوم");

    // The quick ticks sit below the Next Prayer card and the tiles.
    const fajr = screen.getByTestId("prayer-log-tick-fajr");
    await screen.scrollUntilVisible(fajr, { direction: "down" });

    // One tap at a time: each is a gesture on the device, in order.
    /* oxlint-disable no-await-in-loop */
    for (const salah of SALAH) {
      const tick = screen.getByTestId(`prayer-log-tick-${salah}`);
      await expect(tick).not.toBeSelected();
      await tick.tap();
      await expect(tick).toBeSelected();
    }
    /* oxlint-enable no-await-in-loop */

    await screen.scrollUntilVisible(streak, { direction: "up" });
    await expect(streak).toHaveAccessibleName("سلسلة الصلاة: يوم واحد");

    // The Account screen confirms the Believer is still a Guest.
    await screen.getByRole("button", "الحساب").tap();
    await expect(screen.getByText("أنت تستخدم التطبيق ضيفًا")).toBeVisible();
  }
);
