import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, startAsNewGuest } from "./support/journey";

// Ticket 25: a Guest starts the suggested 30-day Khatmah, holds the ayah
// where today's portion ends (the last ayah of Juz 1, Al-Baqarah 141), and
// completes the portion from the ayah sheet. The Khatmah then shows the
// first session done and the second as today's portion, from Al-Baqarah 142.
// Numbers are written in Arabic-Indic digits, as the app shows them.

test(
  "a Guest completes today's Khatmah portion from the ayah sheet",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });

    await device.openLink("alrisali://khatmah");
    await screen.getByTestId("khatmah-new").tap();
    const start = screen.getByTestId("khatmah-start");
    await screen.scrollUntilVisible(start, { direction: "down" });
    await start.tap();

    await expect(screen.getByTestId("khatmah-standing")).toHaveText(
      "على المسار"
    );
    await expect(screen.getByTestId("khatmah-portion")).toContainText("١٤١");

    // The ayah where the portion ends offers to complete it.
    await device.openLink("alrisali://quran?ayah=2:141");
    await screen.getByTestId("quran-ayah-end-2:141").longPress();
    await screen.getByTestId("khatmah-complete-portion").tap();
    await expect(screen.getByTestId("khatmah-banner")).not.toBeVisible();

    // Back on the Khatmah, session 1 is done and today's portion moves on.
    await device.openLink("alrisali://khatmah");
    await expect(screen.getByTestId("khatmah-portion")).toContainText("١٤٢");
    const first = screen.getByTestId("khatmah-session-1");
    await screen.scrollUntilVisible(first, { direction: "down" });
    await expect(first).toContainText("تمّت");
  }
);
