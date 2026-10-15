import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, startAsNewGuest } from "./support/journey";

// Ticket 40: Insights are worked out on the device, so a new Guest opens them
// from Home with no account and sees an empty week.

test(
  "a Guest opens Insights from Home",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });

    const open = screen.getByTestId("insights-open");
    await screen.scrollUntilVisible(open, { direction: "down" });
    await open.tap();

    await expect(
      screen.getByTestId("insights-prayer-streak")
    ).toHaveAccessibleName("سلسلة الصلاة: 0 يوم");
    await expect(screen.getByTestId("insights-khushu")).toHaveAccessibleName(
      "متوسط الخشوع: لا تقييمات بعد"
    );
    await expect(screen.getByTestId("insights-habits")).toHaveAccessibleName(
      "العادات المنجزة: لا عادات مستحقة"
    );
  }
);
