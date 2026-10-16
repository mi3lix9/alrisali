/**
 * Where the six Shrines stand, as latitude and longitude in degrees (WGS84,
 * north and east positive), each at the tomb or the shrine building's centre.
 * Coordinates are public geographic facts; each was read from the shrine's
 * Wikipedia article (infobox coordinates, degrees-minutes-seconds converted
 * to decimals and rounded to 4 places, about 10 m) and agrees with
 * OpenStreetMap to within the building's size. See `notices/qibla-targets.md`.
 *
 * - najaf: Imam Ali Shrine, Najaf, Iraq
 *   https://en.wikipedia.org/wiki/Imam_Ali_Shrine (31°59′46″N 44°18′52″E)
 * - karbala: Imam Husayn Shrine, Karbala, Iraq
 *   https://en.wikipedia.org/wiki/Imam_Husayn_Shrine (32°36′59″N 44°01′56″E)
 * - mashhad: Imam Reza Shrine, Mashhad, Iran
 *   https://en.wikipedia.org/wiki/Imam_Reza_shrine (36°17′16″N 59°36′59″E)
 * - madina: Prophet's Mosque (the tomb of the Prophet), Madina, Saudi Arabia
 *   https://en.wikipedia.org/wiki/Prophet%27s_Mosque (24°28′06″N 39°36′39″E)
 * - kadhimiya: Al-Kadhimiya Mosque, Baghdad, Iraq
 *   https://en.wikipedia.org/wiki/Al-Kadhimiya_Mosque (33°22′49″N 44°20′22″E)
 * - samarra: Al-Askari Shrine, Samarra, Iraq
 *   https://en.wikipedia.org/wiki/Al-Askari_Shrine (34°11′58″N 43°52′26″E)
 */
export interface ShrineCoordinates {
  latitude: number;
  longitude: number;
}

export const SHRINE_COORDINATES = {
  najaf: { latitude: 31.9961, longitude: 44.3144 },
  karbala: { latitude: 32.6164, longitude: 44.0322 },
  mashhad: { latitude: 36.2878, longitude: 59.6164 },
  madina: { latitude: 24.4683, longitude: 39.6108 },
  kadhimiya: { latitude: 33.3803, longitude: 44.3394 },
  samarra: { latitude: 34.1994, longitude: 43.8739 },
} as const satisfies Record<string, ShrineCoordinates>;

export type ShrineId = keyof typeof SHRINE_COORDINATES;
