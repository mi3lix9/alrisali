import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

// Ticket 40: Insights are worked out on the device, so a new Guest opens them
// from Home with no account and sees an empty week. The app launches in
// Arabic, so the expected strings are the Arabic catalogue's.

/** Najaf: Prayer Times needs a location to render Home's cards. */
const NAJAF = { latitude: 32.0283, longitude: 44.3398 };

test(
  "a Guest opens Insights from Home",
  { platforms: ["ios"], timeout: 300_000 },
  async ({ app, device, screen }) => {
    await device.installApp(undefined, { reinstall: true });
    await device.setLocation(NAJAF);
    await app.open();

    // Home is ready (the first launch waits for Metro to bundle the app).
    await expect(screen.getByText("سجل الصلاة")).toBeVisible({
      timeout: 180_000,
    });

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
