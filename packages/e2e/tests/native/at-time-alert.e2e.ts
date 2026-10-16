import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, openTab, startAsNewGuest } from "./support/journey";

// Ticket 05: a Guest opens Maghrib's At-Time Alert from the Prayer
// timetable. It starts on the short takbir; the full adhan is offered but
// disabled, with its reason, while no licensed adhan recording is installed
// (spec 0002, Further Notes). Test plays the unsaved takbir (the system's
// notification sound), then the Guest picks a silent notification, saves,
// and finds it kept on reopening.

test(
  "a Guest sets Maghrib's At-Time Alert, tests it and keeps it",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });
    await openTab(screen, "prayer");

    const maghrib = screen.getByTestId("at-time-alert-maghrib");
    await expect(maghrib).toHaveAccessibleName(
      "تنبيه المغرب عند دخول الوقت: تكبير قصير"
    );
    await maghrib.tap();

    await expect(
      screen.getByTestId("adhan-editor-at-time-takbir")
    ).toBeSelected();
    await expect(
      screen.getByText(
        "لا يتوفّر في التطبيق بعدُ تسجيل أذان مرخّص، فيُتاح الأذان الكامل حين يُضاف تسجيل."
      )
    ).toBeVisible();
    // Disabled: tapping the full adhan leaves the takbir chosen.
    await screen.getByTestId("adhan-editor-at-time-adhan").tap();
    await expect(
      screen.getByTestId("adhan-editor-at-time-takbir")
    ).toBeSelected();

    await screen.getByTestId("adhan-editor-test").tap();

    await screen.getByTestId("adhan-editor-at-time-silent").tap();
    await expect(
      screen.getByTestId("adhan-editor-at-time-silent")
    ).toBeSelected();
    const save = screen.getByTestId("adhan-editor-save");
    await screen.scrollUntilVisible(save, { direction: "down" });
    await save.tap();

    await expect(maghrib).toHaveAccessibleName(
      "تنبيه المغرب عند دخول الوقت: إشعار صامت"
    );
    await maghrib.tap();
    await expect(
      screen.getByTestId("adhan-editor-at-time-silent")
    ).toBeSelected();
  }
);
