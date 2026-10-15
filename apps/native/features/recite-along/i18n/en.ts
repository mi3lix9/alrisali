import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  mode: {
    label: "Recite method",
    hold: "Hold",
    auto: "Auto",
  },
  pace: {
    label: "Speed",
    slow: "Slow",
    normal: "Normal",
    fast: "Fast",
  },
  hint: {
    hold: "Press and hold the text to write the words",
    auto: "Words flow on their own — hold the text or tap pause to stop",
    paused: "Paused — tap continue to carry on",
  },
  text: {
    label: "Text to recite",
    hint: "Press and hold to follow the words",
  },
  progress: "{{count}} / {{total}}",
  pause: "Pause",
  resume: "Continue",
  restart: "Start over",
  done: "Recitation complete, may it be accepted",
};
