// No imports: the native app config reads this file directly.

/**
 * The first path segment of every universal link the app opens, on the web
 * domain it is associated with. iOS and Android are told to hand these paths
 * (and only these) to the app.
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
