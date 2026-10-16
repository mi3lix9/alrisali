/**
 * Where the app's religious content comes from. Every source the app bundles
 * or streams is listed here, and the in-app Sources & Credits screen lists
 * every entry, so a new source is credited by adding it here.
 */
export interface ContentSource {
  /** Stable id; the app's credit strings are keyed by it. */
  id: string;
  /** The source's own name, shown untranslated. */
  name: string;
  url: string;
  licence: { name: string; url: string };
}

export const CONTENT_SOURCES = [
  {
    id: "kfgqpc",
    name: "King Fahd Glorious Qur'an Printing Complex (KFGQPC)",
    url: "https://qurancomplex.gov.sa/quran-dev/",
    licence: {
      name: "KFGQPC Quran developer release (kfgqpc_hafs_v30) and font EULA",
      url: "https://qurancomplex.gov.sa/quran-dev/",
    },
  },
  {
    id: "thaqalayn",
    name: "Thaqalayn (Stichting Thaqalayn)",
    url: "https://thaqalayn.com",
    licence: {
      name: "CC BY 4.0",
      url: "https://creativecommons.org/licenses/by/4.0/",
    },
  },
  {
    id: "alquran-cloud",
    name: "alquran.cloud / Islamic Network",
    url: "https://alquran.cloud",
    licence: {
      name: "alquran.cloud terms: free redistribution; recordings' copyrights belong to the reciters",
      url: "https://alquran.cloud/terms-and-conditions",
    },
  },
  {
    id: "everyayah",
    name: "EveryAyah.com",
    url: "https://everyayah.com",
    licence: {
      name: "Recordings' copyrights belong to the reciters",
      url: "https://everyayah.com",
    },
  },
  {
    id: "tanzil",
    name: "Tanzil Quran Metadata",
    url: "https://tanzil.net/docs/quran_metadata",
    licence: {
      name: "CC BY 3.0",
      url: "https://creativecommons.org/licenses/by/3.0/",
    },
  },
  {
    id: "adhan-recording",
    name: "“AzaanMaahur.ogg” by Saeed Hatamzadeh-Varmazyar, Wikimedia Commons",
    url: "https://commons.wikimedia.org/wiki/File:AzaanMaahur.ogg",
    licence: {
      name: "CC BY-SA 4.0 (opening excerpt, converted to WAV)",
      url: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
  },
  {
    id: "wmm",
    name: "World Magnetic Model WMM2025 (NOAA NCEI and BGS)",
    url: "https://www.ncei.noaa.gov/products/world-magnetic-model",
    licence: {
      name: "Public domain (U.S. Government work)",
      url: "https://www.ncei.noaa.gov/products/world-magnetic-model",
    },
  },
] as const satisfies readonly ContentSource[];

export type ContentSourceId = (typeof CONTENT_SOURCES)[number]["id"];
