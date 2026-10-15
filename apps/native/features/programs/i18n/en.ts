import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

// English plurals use only `_one` and `_other`; the rest mirror Arabic's
// keys so the catalogues share one shape.
export const en: Catalog<typeof ar> = {
  title: "Programs",
  link: {
    title: "Official Programs",
    description: "Worship plans from the Al-Risali team, general and seasonal.",
    subscribed_zero: "No Subscriptions yet",
    subscribed_one: "Subscribed to {{count}} Program",
    subscribed_two: "Subscribed to {{count}} Programs",
    subscribed_few: "Subscribed to {{count}} Programs",
    subscribed_many: "Subscribed to {{count}} Programs",
    subscribed_other: "Subscribed to {{count}} Programs",
    open: "Browse Programs",
  },
  mine: "My Programs",
  available: "Available Programs",
  noneAvailable:
    "No Programs are available right now. Seasonal Programs appear in their season.",
  loadError: "Programs could not be loaded.",
  limits:
    "You can subscribe to up to {{total}} Programs, of which one General and one Seasonal.",
  category: {
    general: "General",
    seasonal: "Seasonal",
  },
  window: "{{start}} to {{end}}",
  outOfSeason: "Out of season",
  paused: "Paused",
  subscribed: "Subscribed",
  acts_zero: "No Acts",
  acts_one: "{{count}} Act",
  acts_two: "{{count}} Acts",
  acts_few: "{{count}} Acts",
  acts_many: "{{count}} Acts",
  acts_other: "{{count}} Acts",
  actsTitle: "Acts",
  noActs: "No Acts have been added to this Program yet.",
  notFound: "This Program is no longer available.",
  actions: {
    subscribe: "Subscribe",
    pause: "Pause",
    resume: "Resume",
    unsubscribe: "Unsubscribe",
  },
  unsubscribe: {
    title: "Unsubscribe from this Program?",
    message:
      "Its Acts will no longer appear in your day. You can subscribe again later.",
    confirm: "Unsubscribe",
    cancel: "Cancel",
  },
  refused: {
    title: "Can't subscribe",
    "already-subscribed": "You are already subscribed to this Program.",
    "maximum-programs":
      "You have reached the limit of {{limit}} Programs. Unsubscribe from another one first (paused Programs count too).",
    "maximum-general":
      "You can subscribe to only one General Program. Unsubscribe from your current General Program first.",
    "maximum-seasonal":
      "You can subscribe to only one Seasonal Program. Unsubscribe from your current Seasonal Program first.",
    ok: "OK",
  },
  saveError: "The change could not be saved. Please try again.",
  schedule: {
    daily: "Daily",
    weekdays: "On {{days}}",
    once: "Once, on {{date}}",
  },
  salah: {
    before: "Before {{salah}}",
    after: "After {{salah}}",
  },
  salahNames: {
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
  },
  types: {
    regular: "Act",
    dua: "Dua",
    prayer: "Prayer",
  },
  rakahs_zero: "{{count}} rak'ahs",
  rakahs_one: "{{count}} rak'ah",
  rakahs_two: "{{count}} rak'ahs",
  rakahs_few: "{{count}} rak'ahs",
  rakahs_many: "{{count}} rak'ahs",
  rakahs_other: "{{count}} rak'ahs",
};
