import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Library materials",
  empty: "Nothing has been published yet.",
  notFound: "This material is no longer available.",
  loading: "Loading…",
  loadError:
    "Couldn't open this material. Check your connection and try again.",
  retry: "Try again",
  category: {
    quran: "Quran",
    hadith: "Hadith",
    dua: "Dua",
    fiqh: "Fiqh",
    history: "History",
    general: "General",
  },
  kind: {
    pdf: "PDF",
    audio: "Audio",
    video: "Video",
    text: "Text",
  },
  pdf: {
    page: "Page {{page}} of {{pages}}",
  },
  player: {
    play: "Play",
    pause: "Pause",
    back: "Back {{seconds}} seconds",
    forward: "Forward {{seconds}} seconds",
    position: "Playback position",
  },
  text: {
    smaller: "Smaller text",
    larger: "Larger text",
  },
};
