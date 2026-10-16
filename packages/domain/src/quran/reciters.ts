import { ayahNumber, findAyah } from "./mushaf";
import type { AyahKey } from "./mushaf";

// The reciters a Believer can pick, bundled with the app: choosing one makes
// no network call. Each ayah streams straight from its free, key-less source
// to the device; no server sits between them.
//
// - alquran.cloud (Islamic Network) is the primary source. Its audio CDN
//   names files by the ayah's place in the whole Quran (1–6236). Editions and
//   bitrates were curated from
//   https://api.alquran.cloud/v1/edition?format=audio&type=versebyverse and
//   each bitrate checked against the CDN, which refuses the ones an edition
//   is not published in.
// - EveryAyah.com covers reciters alquran.cloud lacks. Subfolders are copied
//   verbatim from https://everyayah.com/data/recitations.js; sets its
//   recitations_ayat.html reports incomplete are left out.
//
// Recordings' copyrights belong to the reciters; the app caches what it
// plays, as both sources ask.

export type RecitationStyle = "murattal" | "mujawwad" | "muallim";

export type ReciterSource =
  | {
      kind: "alquran-cloud";
      /** The alquran.cloud audio edition, e.g. `ar.alafasy`. */
      edition: string;
      /** kbps; a path segment of the CDN URL. */
      bitrate: number;
    }
  | {
      kind: "everyayah";
      /** The folder under https://everyayah.com/data/, verbatim. */
      subfolder: string;
      /** kbps, as the subfolder names it. */
      bitrate: number;
    };

export interface Reciter {
  /** Stable key kept in the Believer's settings and the device's cache. */
  key: string;
  name: { ar: string; en: string };
  style: RecitationStyle;
  source: ReciterSource;
}

const alquranCloud = (
  edition: string,
  bitrate: number,
  name: Reciter["name"],
  style: RecitationStyle = "murattal"
): Reciter => ({
  key: edition,
  name,
  style,
  source: { kind: "alquran-cloud", edition, bitrate },
});

const everyAyah = (
  key: string,
  subfolder: string,
  bitrate: number,
  name: Reciter["name"],
  style: RecitationStyle = "murattal"
): Reciter => ({
  key: `everyayah.${key}`,
  name,
  style,
  source: { kind: "everyayah", subfolder, bitrate },
});

const ABDUL_BASIT = {
  ar: "عبد الباسط عبد الصمد",
  en: "Abdul Basit Abdul Samad",
};
const HUSARY = { ar: "محمود خليل الحصري", en: "Mahmoud Khalil Al-Husary" };
const MINSHAWI = { ar: "محمد صديق المنشاوي", en: "Mohamed Siddiq Al-Minshawi" };

export const RECITERS: readonly Reciter[] = [
  alquranCloud("ar.alafasy", 128, {
    ar: "مشاري راشد العفاسي",
    en: "Mishary Rashid Alafasy",
  }),
  alquranCloud("ar.abdulsamad", 64, ABDUL_BASIT),
  everyAyah(
    "abdul-basit-mujawwad",
    "Abdul_Basit_Mujawwad_128kbps",
    128,
    ABDUL_BASIT,
    "mujawwad"
  ),
  everyAyah("minshawy-murattal", "Minshawy_Murattal_128kbps", 128, MINSHAWI),
  everyAyah(
    "minshawy-mujawwad",
    "Minshawy_Mujawwad_192kbps",
    192,
    MINSHAWI,
    "mujawwad"
  ),
  alquranCloud("ar.husary", 128, HUSARY),
  alquranCloud("ar.husarymujawwad", 128, HUSARY, "mujawwad"),
  everyAyah("husary-muallim", "Husary_Muallim_128kbps", 128, HUSARY, "muallim"),
  everyAyah("tablaway", "Mohammad_al_Tablaway_128kbps", 128, {
    ar: "محمد محمود الطبلاوي",
    en: "Mohammad Al-Tablawi",
  }),
  alquranCloud("ar.shaatree", 128, {
    ar: "أبو بكر الشاطري",
    en: "Abu Bakr Al-Shatri",
  }),
  alquranCloud("ar.ahmedajamy", 128, {
    ar: "أحمد بن علي العجمي",
    en: "Ahmed ibn Ali Al-Ajamy",
  }),
  alquranCloud("ar.abdurrahmaansudais", 64, {
    ar: "عبد الرحمن السديس",
    en: "Abdul Rahman Al-Sudais",
  }),
  alquranCloud("ar.saoodshuraym", 64, {
    ar: "سعود الشريم",
    en: "Saud Al-Shuraim",
  }),
  alquranCloud("ar.mahermuaiqly", 128, {
    ar: "ماهر المعيقلي",
    en: "Maher Al-Muaiqly",
  }),
  alquranCloud("ar.hudhaify", 128, {
    ar: "علي بن عبد الرحمن الحذيفي",
    en: "Ali Al-Hudhaify",
  }),
  alquranCloud("ar.muhammadayyoub", 128, {
    ar: "محمد أيوب",
    en: "Muhammad Ayyub",
  }),
  alquranCloud("ar.muhammadjibreel", 128, {
    ar: "محمد جبريل",
    en: "Muhammad Jibreel",
  }),
  alquranCloud("ar.abdullahbasfar", 64, {
    ar: "عبد الله بصفر",
    en: "Abdullah Basfar",
  }),
  alquranCloud("ar.hanirifai", 64, {
    ar: "هاني الرفاعي",
    en: "Hani Al-Rifai",
  }),
  alquranCloud("ar.parhizgar", 48, {
    ar: "شهريار پرهيزگار",
    en: "Shahriar Parhizgar",
  }),
  everyAyah("karim-mansoori", "Karim_Mansoori_40kbps", 40, {
    ar: "كريم منصوري",
    en: "Karim Mansoori",
  }),
];

/** Mishary Rashid Alafasy (Murattal). */
export const DEFAULT_RECITER = "ar.alafasy";

const reciterByKey: Record<string, Reciter> = Object.fromEntries(
  RECITERS.map((reciter) => [reciter.key, reciter])
);

/** The bundled reciter a key names, or undefined when the app has none. */
export const findReciter = (key: string): Reciter | undefined =>
  reciterByKey[key];

/** Where one ayah, as one bundled reciter recites it, streams from. */
export const recitationUrl = (reciterKey: string, ayah: AyahKey): string => {
  const reciter = findReciter(reciterKey);
  if (!reciter) {
    throw new RangeError(`No reciter ${reciterKey}`);
  }
  const found = findAyah(ayah);
  const number = ayahNumber(ayah);
  if (!(found && number)) {
    throw new RangeError(`No ayah ${ayah}`);
  }
  const { source } = reciter;
  if (source.kind === "alquran-cloud") {
    return `https://cdn.islamic.network/quran/audio/${source.bitrate}/${source.edition}/${number}.mp3`;
  }
  const sss = String(found.surah).padStart(3, "0");
  const aaa = String(found.ayah).padStart(3, "0");
  return `https://everyayah.com/data/${source.subfolder}/${sss}${aaa}.mp3`;
};
