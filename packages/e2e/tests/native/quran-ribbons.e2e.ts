import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import type { Screen } from "e2e";

import { JOURNEY_TIMEOUT, startAsNewGuest } from "./support/journey";

// Ticket 18: a Guest puts the red Bookmark Ribbon on one ayah, then on
// another; the ribbon moves, and the index's Saved tab shows it on the
// second. Numbers are in Arabic-Indic digits, as the reader shows them.

/** Shows the reader's controls (a tap on the page toggles them). */
const showControls = async (screen: Screen) => {
  if (!(await screen.getByTestId("quran-reader-back").isVisible())) {
    await screen.getByTestId("quran-page-1").tap();
  }
};

test(
  "a Guest moves the red Bookmark Ribbon to a second ayah",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });

    const resume = screen.getByTestId("quran-continue-reading");
    await screen.scrollUntilVisible(resume, { direction: "down" });
    await resume.tap();
    await expect(screen.getByTestId("quran-page-1")).toBeVisible();

    // Long-press Al-Fatihah 1:2 and put the red ribbon there.
    await screen.getByTestId("quran-ayah-end-1:2").longPress();
    await screen.getByTestId("ayah-sheet-ribbon-red").tap();
    await expect(
      screen.getByTestId("ayah-sheet-ribbon-red")
    ).toHaveAccessibleName("أزل الشريط الأحمر من هنا");

    // The sheet's arrow moves to 1:3; the red ribbon follows when chosen.
    await screen.getByTestId("ayah-sheet-next").tap();
    await screen.getByTestId("ayah-sheet-ribbon-red").tap();
    await expect(
      screen.getByTestId("ayah-sheet-ribbon-red")
    ).toHaveAccessibleName("أزل الشريط الأحمر من هنا");

    // Close the sheet, then open the index's Saved tab.
    await screen.getByTestId("quran-page-1").tap();
    await showControls(screen);
    await screen.getByTestId("quran-reader-index").tap();
    await screen.getByTestId("quran-index-tab-saved").tap();

    const red = screen.getByTestId("quran-saved-ribbon-red");
    await expect(red).toBeVisible();
    await expect(red).toContainText("الآية ٣");
  }
);
