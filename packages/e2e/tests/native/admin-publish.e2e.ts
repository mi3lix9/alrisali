import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { adminSkipReason, callAdmin } from "./support/admin-api";
import { JOURNEY_TIMEOUT, openTab, startAsNewGuest } from "./support/journey";

// Ticket 13: Admins publish to the content database and devices read their
// replica, pulled at every launch. An Admin publishes an Official Program
// with a name unique to this run; the device, already running, shows it
// after its next launch. The Program is deleted again at the end.
//
// Needs E2E_SERVER_URL and E2E_ADMIN_COOKIE (support/admin-api.ts); skipped
// without them.

/** How long the replica may take to pull after the launch. */
const PULL_TIMEOUT = 60_000;

test(
  "an Admin publishes a Program and the device receives it",
  {
    platforms: ["ios"],
    timeout: JOURNEY_TIMEOUT,
    skip: adminSkipReason,
  },
  async ({ app, device, screen }) => {
    const id = crypto.randomUUID();
    const name = `برنامج ${id.slice(0, 8)}`;

    await startAsNewGuest({ app, device, screen });

    await callAdmin("programs.save", {
      id,
      category: "general",
      name: { ar: name, en: `Program ${id.slice(0, 8)}` },
      description: { ar: "", en: "" },
      active: true,
      acts: [],
    });
    try {
      // The next launch pulls the content replica.
      await app.restart();
      await openTab(screen, "worship");
      const open = screen.getByTestId("programs-open");
      await screen.scrollUntilVisible(open, { direction: "down" });
      await open.tap();

      const program = screen.getByText(name);
      await screen.scrollUntilVisible(program, {
        direction: "down",
        timeout: PULL_TIMEOUT,
      });
      await expect(program).toBeVisible();
    } finally {
      await callAdmin("programs.remove", { id });
    }
  }
);
