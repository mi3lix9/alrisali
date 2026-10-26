import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import type { Screen } from "e2e";

import { JOURNEY_TIMEOUT, startAsNewGuest } from "./support/journey";

// Tickets 23 to 25: a Guest starts reading the Quran from Home, goes to a
// page, leaves the reader and the app, and "Continue reading" brings them
// back to the Last-Read Ayah: the first ayah of the page they went to.
// Numbers are written in Arabic-Indic digits, as the reader shows them.

/** Page 50, in juz 3. */
const PAGE = 50;
const PAGE_DIGITS = "٥٠";

/**
 * Shows the reader's controls. They hide after a few idle seconds, and a tap
 * on the page toggles them, so the page is tapped only when they are hidden.
 */
const showControls = async (screen: Screen, page: number) => {
  if (!(await screen.getByTestId("quran-reader-back").isVisible())) {
    await screen.getByTestId(`quran-page-${page}`).tap();
  }
};

test(
  "a Guest resumes the Quran at the Last-Read Ayah",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });

    // Before any reading, the card offers to start at Al-Fatihah.
    const resume = screen.getByTestId("quran-continue-reading");
    await screen.scrollUntilVisible(resume, { direction: "down" });
    await expect(resume).toHaveAccessibleName("ابدأ القراءة");
    await resume.tap();
    await expect(screen.getByTestId("quran-page-1")).toBeVisible();

    // Go to the page through the index's page jump.
    await showControls(screen, 1);
    await screen.getByTestId("quran-reader-index").tap();
    await screen.getByTestId("quran-index-tab-page").tap();
    await screen.getByTestId("quran-page-jump-input").fill(String(PAGE));
    await screen.getByTestId("quran-page-jump-open").tap();
    await expect(screen.getByTestId(`quran-page-${PAGE}`)).toBeVisible();

    // Leave the reader, then the app: the Last-Read Ayah is kept.
    await showControls(screen, PAGE);
    await screen.getByTestId("quran-reader-back").tap();
    await app.restart();

    const position = screen.getByTestId("quran-last-read-position");
    await screen.scrollUntilVisible(position, { direction: "down" });
    await expect(position).toContainText(`الصفحة ${PAGE_DIGITS}`);
    await screen.scrollUntilVisible(resume, { direction: "down" });
    await expect(resume).toHaveAccessibleName("تابع");
    await resume.tap();

    await expect(screen.getByTestId(`quran-page-${PAGE}`)).toBeVisible();
  }
);
