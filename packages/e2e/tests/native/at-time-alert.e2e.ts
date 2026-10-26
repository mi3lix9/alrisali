import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, openTab, startAsNewGuest } from "./support/journey";

// Ticket 05: a Guest opens Maghrib's At-Time Alert from the Prayer
// timetable. It starts on the short takbir; the full adhan is offered but
// disabled, with its reason, while no adhan voice is downloaded (spec 0002,
// Further Notes). The sheet's play button sounds the takbir (the system's
// notification sound), then the Guest picks a silent notification, which
// saves at once and shows in the sheet's summary.

test(
  "a Guest sets Maghrib's At-Time Alert, hears it and keeps it",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });
    await openTab(screen, "prayer");

    const maghrib = screen.getByTestId("at-time-alert-maghrib");
    await expect(maghrib).toHaveAccessibleName(
      "تنبيه المغرب عند دخول الوقت: تكبير قصير"
    );
    await maghrib.tap();

    // The sheet's preview plays the takbir (the system's notification sound).
    await screen.getByTestId("reminder-sheet-preview").tap();
    await screen.getByTestId("reminder-sheet-at-time").tap();

    await expect(
      screen.getByTestId("adhan-editor-at-time-takbir")
    ).toBeSelected();
    await expect(
      screen.getByText(
        "حمّل صوت أذان من صفحة صوت الأذان ليُتاح الأذان الكامل دون اتصال."
      )
    ).toBeVisible();
    // Disabled: tapping the full adhan leaves the takbir chosen.
    await screen.getByTestId("adhan-editor-at-time-adhan").tap();
    await expect(
      screen.getByTestId("adhan-editor-at-time-takbir")
    ).toBeSelected();

    // Every change saves at once: pick a silent notification and go back.
    await screen.getByTestId("adhan-editor-at-time-silent").tap();
    await expect(
      screen.getByTestId("adhan-editor-at-time-silent")
    ).toBeSelected();
    await screen.getByTestId("reminder-sheet-back").tap();
    await expect(
      screen.getByText("إشعار صامت عند دخول وقت المغرب")
    ).toBeVisible();
  }
);
