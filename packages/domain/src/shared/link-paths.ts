/**
 * The first path segment of every universal link the app opens, on the web
 * domain it is associated with. iOS and Android are told to hand these paths
 * (and only these) to the app. `apps/native/app.config.ts` keeps a copy; its
 * test keeps the two equal.
 */
export const LINK_PATH_ROOTS = [
  "ayah",
  "quran",
  "supplication",
  "khatmah",
  "qibla",
  "tasbih",
  "next-salah",
  "prayer",
] as const;
