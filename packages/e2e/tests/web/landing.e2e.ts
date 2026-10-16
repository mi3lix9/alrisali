import { test } from "@e2e-dev/web";
import { expect } from "e2e";

// The landing page is Arabic at `/` and English at `/en`; each links to the
// other and to both stores.

test(
  "a visitor reads the Arabic landing page and switches to English",
  { platforms: ["web"] },
  async ({ app, browser, screen }) => {
    await app.open("/");
    await expect(
      screen.getByRole("heading", "الصلاة والقرآن والدعاء والذكر في مكان واحد", {
        level: 1,
      })
    ).toBeVisible();
    await expect(screen.getByRole("link", /App Store/u)).toBeVisible();
    await expect(screen.getByRole("link", /Google Play/u)).toBeVisible();

    await screen.getByRole("link", "English").tap();

    await expect(browser).toHaveURL("/en");
    await expect(
      screen.getByRole(
        "heading",
        "Prayer, Quran, supplications and dhikr in one place",
        {
          level: 1,
        }
      )
    ).toBeVisible();
  }
);
