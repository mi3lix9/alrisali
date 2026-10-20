import { SHRINE_COORDINATES } from "./data/shrines";
import type { ShrineId } from "./data/shrines";

export { SHRINE_COORDINATES } from "./data/shrines";
export type { ShrineCoordinates, ShrineId } from "./data/shrines";

/** Where the Kaaba stands: the centre of the Masjid al-Haram's Kaaba. */
export const KAABA_COORDINATES = { latitude: 21.4225, longitude: 39.8262 };

export const SHRINE_IDS = Object.keys(SHRINE_COORDINATES) as ShrineId[];
