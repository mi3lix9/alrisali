import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  tasbihAlZahra: "Tasbih al-Zahra",
  dhikr: {
    "allahu-akbar": "Allahu Akbar",
    alhamdulillah: "Alhamdulillah",
    subhanallah: "Subhanallah",
  },
  counter: {
    label: "Tasbih counter",
    hint: "Tap to count",
    progress: "{{count}} of {{target}}",
    step: "Step {{step}} of {{steps}}",
  },
  roundCompleted: "Round complete. Dhikr Session saved.",
  reset: {
    action: "Start over",
    title: "Start Tasbih al-Zahra over?",
    message: "The current count will be cleared.",
    confirm: "Start over",
    cancel: "Cancel",
  },
};
