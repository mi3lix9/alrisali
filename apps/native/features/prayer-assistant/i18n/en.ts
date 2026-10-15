import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

// English plurals use only `_one` and `_other`; `_two` and `_few` mirror
// Arabic's forms so the catalogue keeps the same keys.
export const en: Catalog<typeof ar> = {
  title: "Prayer Assistant",
  card: {
    description:
      "Follows you through a Salah and keeps count of your Rak'ahs and Positions.",
    start: "Start",
  },
  setup: {
    salah: "Salah",
    salahRakahs_two: "{{name}} · {{count}} Rak'ahs",
    salahRakahs_few: "{{name}} · {{count}} Rak'ahs",
    salahRakahs_other: "{{name}} · {{count}} Rak'ahs",
    pace: "Pace",
    paceDescription: "How long the assistant waits in each Position.",
    customHold: "Each Position",
    customTashahhud: "Sitting for Tashahhud",
    seconds: "{{value}} s",
    bowSensitivity: "Bow sensitivity",
    bowSensitivityDescription:
      "Used when the camera senses your Positions: higher accepts a shallower bow.",
    deeper: "Deeper bow",
    shallower: "Shallower bow",
    start: "Start Salah",
  },
  pace: {
    slow: "Slow",
    normal: "Normal",
    fast: "Fast",
    custom: "Custom",
  },
  salah: {
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
  },
  rakah: {
    first: "First Rak'ah",
    second: "Second Rak'ah",
    third: "Third Rak'ah",
    fourth: "Fourth Rak'ah",
  },
  position: {
    qiyam: "Qiyam",
    ruku: "Ruku",
    itidal: "I'tidal",
    sujud: "Sujud",
    jalsa: "Jalsa",
    tashahhud: "Tashahhud",
    finalTashahhud: "Final Tashahhud",
  },
  praying: {
    tapHint: "Tap anywhere on the screen as you move to the next Position.",
    tapToAdvance: "Next Position",
    back: "Step back",
    finalHint:
      "Stay seated until you finish the tashahhud and salam, or tap to finish.",
    finish: "I've finished",
    stop: "Stop",
    stopTitle: "Stop the assistant?",
    stopMessage: "This Salah won't be logged.",
    stopCancel: "Keep going",
    stopConfirm: "Stop",
  },
};
