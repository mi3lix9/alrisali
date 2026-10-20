import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, startAsNewGuest } from "./support/journey";

// Ticket 45: a link opens the app at the place it names from a cold start,
// and a link that names nothing lands on Home.

/** Ayat al-Kursi, 2:255, is on page 42 of the Mushaf. */
const AYAT_AL_KURSI_PAGE = 42;

test(
  "an ayah link opens its page from a cold start, an unknown link opens Home",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });

    // Cold start: the app is closed before the link arrives.
    await device.closeApp();
    await device.openLink("alrisali://ayah/2:255");
    await expect(
      screen.getByTestId(`quran-page-${AYAT_AL_KURSI_PAGE}`)
    ).toBeVisible();

    await device.closeApp();
    await device.openLink("alrisali://nothing-here");
    const resume = screen.getByTestId("quran-continue-reading");
    await screen.scrollUntilVisible(resume, { direction: "down" });
    await expect(resume).toBeVisible();
  }
);
