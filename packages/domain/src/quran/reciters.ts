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

/** Where a reciter is from; the sheet groups under it, within a style. */
export type ReciterRegion = "egypt" | "saudi-arabia" | "kuwait" | "iran";

/** The regions in the order the picker lists them. */
export const RECITER_REGIONS: readonly ReciterRegion[] = [
  "saudi-arabia",
  "egypt",
  "kuwait",
  "iran",
];

/** The styles in the order the picker lists them. */
export const RECITATION_STYLES: readonly RecitationStyle[] = [
  "murattal",
  "mujawwad",
  "muallim",
];

/** A person who recites: one identity and both names across every style they are recorded in. */
export interface ReciterPerson {
  id: string;
  name: { ar: string; en: string };
  region: ReciterRegion;
}

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
  /** Who recites; shared by every style the person is bundled in. */
  person: ReciterPerson;
  /** The person's name, in both languages. */
  name: { ar: string; en: string };
  region: ReciterRegion;
  style: RecitationStyle;
  source: ReciterSource;
}

const alquranCloud = (
  edition: string,
  bitrate: number,
  person: ReciterPerson,
  style: RecitationStyle = "murattal"
): Reciter => ({
  key: edition,
  person,
  name: person.name,
  region: person.region,
  style,
  source: { kind: "alquran-cloud", edition, bitrate },
});

const everyAyah = (
  key: string,
  subfolder: string,
  bitrate: number,
  person: ReciterPerson,
  style: RecitationStyle = "murattal"
): Reciter => ({
  key: `everyayah.${key}`,
  person,
  name: person.name,
  region: person.region,
  style,
  source: { kind: "everyayah", subfolder, bitrate },
});

const person = (
  id: string,
  region: ReciterRegion,
  ar: string,
  en: string
): ReciterPerson => ({ id, region, name: { ar, en } });

const ALAFASY = person(
  "alafasy",
  "kuwait",
  "مشاري راشد العفاسي",
  "Mishary Rashid Alafasy"
);
const ABDUL_BASIT = person(
  "abdul-basit",
  "egypt",
  "عبد الباسط عبد الصمد",
  "Abdul Basit Abdul Samad"
);
const HUSARY = person(
  "husary",
  "egypt",
  "محمود خليل الحصري",
  "Mahmoud Khalil Al-Husary"
);
const MINSHAWI = person(
  "minshawi",
  "egypt",
  "محمد صديق المنشاوي",
  "Mohamed Siddiq Al-Minshawi"
);
const TABLAWI = person(
  "tablawi",
  "egypt",
  "محمد محمود الطبلاوي",
  "Mohammad Al-Tablawi"
);
const SHATRI = person(
  "shatri",
  "saudi-arabia",
  "أبو بكر الشاطري",
  "Abu Bakr Al-Shatri"
);
const AJAMY = person(
  "ajamy",
  "saudi-arabia",
  "أحمد بن علي العجمي",
  "Ahmed ibn Ali Al-Ajamy"
);
const SUDAIS = person(
  "sudais",
  "saudi-arabia",
  "عبد الرحمن السديس",
  "Abdul Rahman Al-Sudais"
);
const SHURAIM = person(
  "shuraim",
  "saudi-arabia",
  "سعود الشريم",
  "Saud Al-Shuraim"
);
const MUAIQLY = person(
  "muaiqly",
  "saudi-arabia",
  "ماهر المعيقلي",
  "Maher Al-Muaiqly"
);
const HUDHAIFY = person(
  "hudhaify",
  "saudi-arabia",
  "علي بن عبد الرحمن الحذيفي",
  "Ali Al-Hudhaify"
);
const AYYUB = person("ayyub", "saudi-arabia", "محمد أيوب", "Muhammad Ayyub");
const JIBREEL = person("jibreel", "egypt", "محمد جبريل", "Muhammad Jibreel");
const BASFAR = person(
  "basfar",
  "saudi-arabia",
  "عبد الله بصفر",
  "Abdullah Basfar"
);
const RIFAI = person("rifai", "saudi-arabia", "هاني الرفاعي", "Hani Al-Rifai");
const PARHIZGAR = person(
  "parhizgar",
  "iran",
  "شهريار پرهيزگار",
  "Shahriar Parhizgar"
);
const MANSOORI = person("mansoori", "iran", "كريم منصوري", "Karim Mansoori");

export const RECITERS: readonly Reciter[] = [
  alquranCloud("ar.alafasy", 128, ALAFASY),
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
  everyAyah("tablaway", "Mohammad_al_Tablaway_128kbps", 128, TABLAWI),
  alquranCloud("ar.shaatree", 128, SHATRI),
  alquranCloud("ar.ahmedajamy", 128, AJAMY),
  alquranCloud("ar.abdurrahmaansudais", 64, SUDAIS),
  alquranCloud("ar.saoodshuraym", 64, SHURAIM),
  alquranCloud("ar.mahermuaiqly", 128, MUAIQLY),
  alquranCloud("ar.hudhaify", 128, HUDHAIFY),
  alquranCloud("ar.muhammadayyoub", 128, AYYUB),
  alquranCloud("ar.muhammadjibreel", 128, JIBREEL),
  alquranCloud("ar.abdullahbasfar", 64, BASFAR),
  alquranCloud("ar.hanirifai", 64, RIFAI),
  alquranCloud("ar.parhizgar", 48, PARHIZGAR),
  everyAyah("karim-mansoori", "Karim_Mansoori_40kbps", 40, MANSOORI),
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

/** Reciters of one style in one region. */
export interface ReciterRegionGroup {
  region: ReciterRegion;
  reciters: readonly Reciter[];
}

/** Reciters of one style, by region. */
export interface ReciterStyleGroup {
  style: RecitationStyle;
  regions: readonly ReciterRegionGroup[];
}

/**
 * The reciters grouped by style, then by region, both in the picker's order.
 * Empty groups are left out; within a region the bundled order is kept.
 */
export const groupReciters = (
  reciters: readonly Reciter[] = RECITERS
): ReciterStyleGroup[] =>
  RECITATION_STYLES.flatMap((style) => {
    const regions = RECITER_REGIONS.flatMap((region) => {
      const inGroup = reciters.filter(
        (reciter) => reciter.style === style && reciter.region === region
      );
      return inGroup.length > 0 ? [{ region, reciters: inGroup }] : [];
    });
    return regions.length > 0 ? [{ style, regions }] : [];
  });
