import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, startAsNewGuest } from "./support/journey";

// Ticket 39: logging a Salah earns the Companion XP (`XP_FOR.salah`, 10).
// A Guest ticks Fajr on Home and the Companion card counts the points.

test(
  "a Guest's Companion earns XP for a logged Salah",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });

    const xp = screen.getByTestId("companion-xp");
    await screen.scrollUntilVisible(xp, { direction: "down" });
    await expect(xp).toHaveText("٠ نقطة");

    const fajr = screen.getByTestId("prayer-log-tick-fajr");
    await screen.scrollUntilVisible(fajr, { direction: "up" });
    await fajr.tap();
    await expect(fajr).toBeSelected();

    await screen.scrollUntilVisible(xp, { direction: "down" });
    await expect(xp).toHaveText("١٠ نقاط");
  }
);
