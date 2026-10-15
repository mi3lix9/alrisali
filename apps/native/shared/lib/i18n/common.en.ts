import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./common.ar";

export const en: Catalog<typeof ar> = {
  appName: "Al-Risali",
  tabs: {
    home: "Home",
    prayer: "Prayer",
    library: "Library",
    worship: "Worship",
    tasbih: "Tasbih",
  },
  settings: "Settings",
  account: "Account",
  notFound: {
    title: "Page not found",
    goHome: "Back to Home",
  },
};
