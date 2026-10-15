import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, openTab, startAsNewGuest } from "./support/journey";

// Tickets 35 and 37: a Believer subscribes to at most five Programs. A new
// Personal Program is subscribed to at once, so a Guest who builds six meets
// the limit on the sixth: the app explains which limit stopped it and keeps
// the Program. Personal Programs need no published content, so the journey
// runs against any server.

/** `SUBSCRIPTION_LIMITS.total`. */
const LIMIT = 5;

test(
  "a Guest subscribes to Programs until the limit refuses one",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT * 2 },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });
    await openTab(screen, "worship");

    const open = screen.getByTestId("programs-open");
    await screen.scrollUntilVisible(open, { direction: "down" });
    await open.tap();

    const build = screen.getByTestId("programs-build");
    const name = screen.getByTestId("programs-builder-name");
    const create = screen.getByTestId("programs-builder-submit");
    const subscribed = screen.getByTestId("programs-subscription-state");

    // One Program at a time: each is built, saved and left in turn.
    /* oxlint-disable no-await-in-loop */
    for (let number = 1; number <= LIMIT + 1; number += 1) {
      await screen.scrollUntilVisible(build, { direction: "down" });
      await build.tap();
      await name.fill(`برنامج ${number}`);
      await device.dismissKeyboard();
      await screen.scrollUntilVisible(create, { direction: "down" });
      await create.tap();
      if (number <= LIMIT) {
        // Saved and subscribed: the builder hands over to the Program.
        await expect(subscribed).toHaveText("مشترك");
        await app.back();
      }
    }
    /* oxlint-enable no-await-in-loop */

    await expect(screen.getByText("لا يمكن الاشتراك")).toBeVisible();
    await expect(
      screen.getByText(
        `وصلت إلى الحد الأقصى وهو ${LIMIT} برامج. ألغِ الاشتراك في برنامج آخر أولًا (البرامج المتوقفة مؤقتًا تُحسب أيضًا).`
      )
    ).toBeVisible();
    await screen.getByRole("button", "حسنًا").tap();
  }
);
