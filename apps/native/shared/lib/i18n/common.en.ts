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
  hijri: {
    date: "{{day}} {{month}} {{year}} AH",
    monthYear: "{{month}} {{year}} AH",
    dayMonth: "{{day}} {{month}}",
    months: {
      muharram: "Muharram",
      safar: "Safar",
      rabiAlAwwal: "Rabi' al-Awwal",
      rabiAlThani: "Rabi' al-Thani",
      jumadaAlUla: "Jumada al-Ula",
      jumadaAlAkhirah: "Jumada al-Akhirah",
      rajab: "Rajab",
      shaban: "Sha'ban",
      ramadan: "Ramadan",
      shawwal: "Shawwal",
      dhuAlQadah: "Dhu al-Qa'dah",
      dhuAlHijjah: "Dhu al-Hijjah",
    },
  },
};
