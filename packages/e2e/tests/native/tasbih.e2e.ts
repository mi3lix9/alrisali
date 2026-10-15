import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, openTab, startAsNewGuest } from "./support/journey";

// Ticket 32: a Guest counts a whole round of Tasbih al-Zahra on the Tasbih
// tab: 34 Allahu Akbar, 33 Alhamdulillah, 33 Subhan Allah. The step line
// moves on at each target, and the round's end saves a Dhikr Session.
// Counts are written in Arabic-Indic digits, as the app shows them.

/** Each step's target, in order (`TASBIH_AL_ZAHRA_STEPS`). */
const STEP_TARGETS = [34, 33, 33] as const;

/** The step line before step `step` (1-based) begins. */
const STEP_LINES = ["الخطوة ١ من ٣", "الخطوة ٢ من ٣", "الخطوة ٣ من ٣"];

/** A hundred taps, each a gesture on the device. */
const ROUND_TIMEOUT = 600_000;

test(
  "a Guest completes a round of Tasbih al-Zahra",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT + ROUND_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });
    await openTab(screen, "tasbih");

    const counter = screen.getByTestId("tasbih-counter");
    const step = screen.getByTestId("tasbih-step");
    const message = screen.getByTestId("tasbih-round-message");

    // One tap at a time, in order: the counter counts on press-in.
    /* oxlint-disable no-await-in-loop */
    for (const [index, target] of STEP_TARGETS.entries()) {
      await expect(step).toHaveText(STEP_LINES[index] ?? "");
      for (let count = 0; count < target; count += 1) {
        await counter.tap();
      }
    }
    /* oxlint-enable no-await-in-loop */

    await expect(message).toHaveText("اكتمل التسبيح وحُفظت الجلسة.");
    // The next round starts at the first step.
    await expect(step).toHaveText("الخطوة ١ من ٣");
  }
);
