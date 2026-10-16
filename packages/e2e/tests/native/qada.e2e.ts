import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, openTab, startAsNewGuest } from "./support/journey";

// Ticket 43: a Guest sets up a Qada Plan of ten days of every Salah, logs a
// Qada Fajr from the Prayer Log, and sees the Qada Backlog drop by one on
// the Qada dashboard. Counts are written in Arabic-Indic digits, as the app
// shows them.

test(
  "a Guest logs a Qada Salah from the Prayer Log and the backlog drops",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });
    await openTab(screen, "prayer");

    const setUp = screen.getByTestId("qada-set-up");
    await screen.scrollUntilVisible(setUp, { direction: "down" });
    await setUp.tap();

    // Ten days of each of the five Salah.
    await screen.getByTestId("qada-preset-days10").tap();
    const save = screen.getByTestId("qada-save");
    await screen.scrollUntilVisible(save, { direction: "down" });
    await save.tap();

    // Back on the Prayer tab, the Prayer Log offers a Qada tick per Salah.
    const qadaFajr = screen.getByTestId("qada-prayer-log-fajr");
    await screen.scrollUntilVisible(qadaFajr, { direction: "up" });
    await expect(qadaFajr).not.toBeSelected();
    await qadaFajr.tap();
    await expect(qadaFajr).toBeSelected();

    const open = screen.getByTestId("qada-open");
    await screen.scrollUntilVisible(open, { direction: "down" });
    await open.tap();

    await expect(screen.getByTestId("qada-remaining-total")).toHaveText("٤٩");
    await expect(screen.getByTestId("qada-remaining-fajr")).toHaveText("٩");
    await expect(screen.getByTestId("qada-remaining-dhuhr")).toHaveText("١٠");
  }
);
