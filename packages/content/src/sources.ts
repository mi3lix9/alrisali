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
    id: "quran-foundation",
    name: "Quran.Foundation",
    url: "https://quran.foundation",
    licence: {
      name: "Quran Foundation Developer Terms",
      url: "https://api-docs.quran.foundation/legal/developer-terms/",
    },
  },
  {
    id: "adhan-recording",
    name: "“Adhan wiki.oga” by Jarih, Wikimedia Commons",
    url: "https://commons.wikimedia.org/wiki/File:Adhan_wiki.oga",
    licence: {
      name: "CC BY-SA 3.0 (converted to WAV)",
      url: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
  },
] as const satisfies readonly ContentSource[];

export type ContentSourceId = (typeof CONTENT_SOURCES)[number]["id"];
