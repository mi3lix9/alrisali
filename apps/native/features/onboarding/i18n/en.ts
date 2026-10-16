import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  position: "Step {{number}} of {{of}}",
  continue: "Continue",
  back: "Back",
  skip: "Skip",
  language: {
    title: "Welcome to Al-Risali",
    description:
      "Choose the app's language. You can change it later in Settings.",
    ar: "العربية",
    en: "English",
    restart: "The app restarts in the new language.",
  },
  location: {
    title: "Your location",
    description:
      "Prayer Times are calculated for your location on this device; it is never sent to a server.",
  },
  calculationMethod: {
    title: "Calculation Method",
    description: "How your Prayer Times are calculated.",
  },
  messageStyle: {
    title: "Message Style",
    description: "How your Reminders and messages are worded.",
  },
  notifications: {
    title: "Reminders",
    description:
      "The app reminds you of Prayer Times and Imsak with notifications from your device itself, even offline.",
    reason:
      "Next your device asks to allow notifications, so the alerts above can arrive. Skipping the alerts keeps the suggested choices.",
    allow: "Allow notifications",
    allowed: "Notifications are allowed.",
    declined:
      "Notifications are off. You can allow them later in Settings → Prayer Reminders.",
  },
  account: {
    title: "Keep your records",
    description:
      "Sign in to sync what you record and keep it on any device, or continue as a Guest and keep everything on this device.",
    guest: "Continue as Guest",
  },
};
