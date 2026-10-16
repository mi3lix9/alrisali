import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Share as image",
  action: {
    ayah: "Share as image",
    supplication: "Share an excerpt as image",
    times: "Share times as image",
  },
  size: {
    label: "Size",
    square: "1:1",
    portrait: "4:5",
    story: "9:16",
  },
  background: {
    label: "Background",
    white: "White",
    sand: "Sand",
    black: "Black",
    green: "Green",
    navy: "Navy",
    maroon: "Maroon",
  },
  opener: {
    label: "Begin with",
    none: "Nothing",
    bismillah: "Bismillah",
    audhu: "A'udhu",
  },
  attribution: {
    label: "Attribution",
    description: "A small line under the image",
    line: "Al-Risali · alrisali.com",
  },
  reference: {
    ayah: "Surah {{surah}} · {{ayah}}",
  },
  section: {
    label: "Excerpt",
    position: "{{number}} of {{count}}",
    previous: "Previous excerpt",
    next: "Next excerpt",
  },
  tooLong:
    "This text is too long for this size. Choose a taller size or turn the attribution off.",
  unavailable: "This image could not be prepared.",
  share: "Share",
  sharing: "Preparing the image",
  failed: "The image could not be shared. Try again.",
  preview: "Image preview",
};
