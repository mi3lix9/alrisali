import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Storage & downloads",
  settingsCard: {
    description:
      "Recitation and adhans downloaded to this device, and their sizes.",
    open: "Open Storage",
  },
  total: "Downloaded to this device",
  empty: "Nothing downloaded yet.",
  kinds: {
    recitation: "Recitation",
    adhan: "Adhans",
  },
  wifiOnly: {
    title: "Download on Wi-Fi only",
    description: "Downloads wait for Wi-Fi and never use your mobile data.",
  },
};
