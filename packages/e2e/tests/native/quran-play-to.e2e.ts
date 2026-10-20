import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, startAsNewGuest } from "./support/journey";

// Ticket 08: a Guest long-presses the first ayah of Al-Fatihah, plays to the
// end of the page, sees the mini player while the ayat recite, and the bar
// goes away at the page's last ayah. Audio streams from the reciter's source,
// so the simulator needs a network.

/** 1:1's first word, as the page prints it. */
const FIRST_WORD = "بِسۡمِ";

/** Page 1's seven ayat recite in well under this. */
const RECITATION_TIMEOUT = 120_000;

test(
  "a Guest plays an ayah to the end of the page with the mini player",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT + RECITATION_TIMEOUT },
  async ({ device, app, screen }) => {
    await startAsNewGuest({ app, device, screen });

    const resume = screen.getByTestId("quran-continue-reading");
    await screen.scrollUntilVisible(resume, { direction: "down" });
    await resume.tap();
    await expect(screen.getByTestId("quran-page-1")).toBeVisible();

    await screen.getByText(FIRST_WORD).longPress();
    await screen.getByTestId("ayah-sheet-play-to").tap();
    await screen.getByTestId("play-to-page").tap();
    await expect(screen.getByTestId("play-to-end")).toBeVisible();
    await screen.getByTestId("play-to-start").tap();

    // The mini player stays while audio plays …
    const stop = screen.getByTestId("recitation-stop");
    await expect(stop).toBeVisible();
    await expect(screen.getByTestId("recitation-next")).toBeVisible();

    // … the range ends with "continue to the next ayat?" (ticket 20) …
    const decline = screen.getByTestId("recitation-continue-no");
    await expect(decline).toBeVisible({ timeout: RECITATION_TIMEOUT });

    // … and declining ends recitation, so the bar goes.
    await decline.tap();
    await expect(stop).toBeHidden();
  }
);
