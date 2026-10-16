import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, startAsNewGuest } from "./support/journey";

// Ticket 09: a Guest opens the Quran, types the address 2:255 in the search
// box and lands on Ayat al-Kursi's page (page 42).

/** The page Ayat al-Kursi (2:255) is printed on. */
const PAGE = 42;

test(
  "a Guest searches 2:255 and lands on its page",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ device, app, screen }) => {
    await startAsNewGuest({ app, device, screen });

    const resume = screen.getByTestId("quran-continue-reading");
    await screen.scrollUntilVisible(resume, { direction: "down" });
    await resume.tap();
    await expect(screen.getByTestId("quran-page-1")).toBeVisible();

    await screen.getByTestId("quran-page-1").tap();
    await screen.getByTestId("quran-reader-search").tap();
    await screen.getByTestId("quran-search-input").fill("2:255");
    await screen.getByTestId("quran-search-ayah-2:255").tap();

    await expect(screen.getByTestId(`quran-page-${PAGE}`)).toBeVisible();
  }
);
