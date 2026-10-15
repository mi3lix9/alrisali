import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { JOURNEY_TIMEOUT, openTab, startAsNewGuest } from "./support/journey";

// Tickets 27 and 28: a Guest opens a Supplication from the Library's Books
// and marks it read today (a Reading Completion). Books ship with the app,
// so the journey needs no server content.

test(
  "a Guest opens a Supplication and marks it read today",
  { platforms: ["ios"], timeout: JOURNEY_TIMEOUT },
  async ({ app, device, screen }) => {
    await startAsNewGuest({ app, device, screen });
    await openTab(screen, "library");

    const book = screen.getByTestId("books-book-sahifa");
    await screen.scrollUntilVisible(book, { direction: "down" });
    await book.tap();
    await screen.getByTestId("books-supplication-sahifa-1").tap();

    // The button follows the Supplication's text.
    const read = screen.getByTestId("reading-completion-mark");
    await screen.scrollUntilVisible(read, { direction: "down" });
    await expect(read).toHaveAccessibleName("قرأته اليوم");
    await read.tap();
    await expect(read).toHaveAccessibleName("قُرئ اليوم");
  }
);
