import type { Salah } from "../shared/salah";
import type { SalahTiming, SunnahPrayerPresetKey } from "./program";

/** A sunnah prayer an Admin can start a prayer Act from. */
export interface SunnahPrayerPreset {
  key: SunnahPrayerPresetKey;
  name: { ar: string; en: string };
  rakahs: number;
  /** The Salah it belongs to; null for the night prayer. */
  salah: { salah: Salah; timing: SalahTiming } | null;
}

/**
 * The daily nawafil (Ja'fari): 2 before Fajr, 8 before Dhuhr, 8 before Asr,
 * 4 after Maghrib, 2 sitting after Isha (al-Watira), and the 11 of the night
 * prayer. Duha, which the old app offered, is not a Ja'fari sunnah.
 */
export const SUNNAH_PRAYER_PRESETS: readonly SunnahPrayerPreset[] = [
  {
    key: "fajr-nafila",
    name: { ar: "نافلة الفجر", en: "Fajr nafila" },
    rakahs: 2,
    salah: { salah: "fajr", timing: "before" },
  },
  {
    key: "dhuhr-nafila",
    name: { ar: "نافلة الظهر", en: "Dhuhr nafila" },
    rakahs: 8,
    salah: { salah: "dhuhr", timing: "before" },
  },
  {
    key: "asr-nafila",
    name: { ar: "نافلة العصر", en: "Asr nafila" },
    rakahs: 8,
    salah: { salah: "asr", timing: "before" },
  },
  {
    key: "maghrib-nafila",
    name: { ar: "نافلة المغرب", en: "Maghrib nafila" },
    rakahs: 4,
    salah: { salah: "maghrib", timing: "after" },
  },
  {
    key: "isha-nafila",
    name: { ar: "نافلة العشاء (الوتيرة)", en: "Isha nafila (al-Watira)" },
    rakahs: 2,
    salah: { salah: "isha", timing: "after" },
  },
  {
    key: "night-prayer",
    name: { ar: "صلاة الليل", en: "Night prayer (Salat al-Layl)" },
    rakahs: 11,
    salah: null,
  },
];
