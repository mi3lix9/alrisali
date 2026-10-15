import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Announcements",
  channel: "Announcements",
  card: {
    description: "Notices from the Al-Risali team, in your language.",
    open: "Announcements inbox",
  },
  screen: {
    receive: "Receive Announcements",
    receiveHint:
      "Notifications from the Al-Risali team. Turn them off any time.",
    denied:
      "Notifications are off for this app, so Announcements can't reach you.",
    allow: "Allow notifications",
    openSettings: "Open Settings",
    unavailable: "This device can't receive Announcements.",
    inbox: "Inbox",
    empty: "No Announcements yet.",
    error: "Couldn't load Announcements. Try again later.",
  },
};
