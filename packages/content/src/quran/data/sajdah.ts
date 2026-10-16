/**
 * Sajdah (prostration) ayat of the Quran, by Ja'fari fiqh, in the Hafs
 * (Kufan) ayah numbering the bundled mushaf uses.
 *
 * - `obligatory`: the four 'azaa'im (al-'azā'im al-arba'a): reciting or
 *   hearing the ayah makes the prostration wajib. 32:15 (as-Sajdah),
 *   41:37 (Fussilat), 53:62 (an-Najm), 96:19 (al-'Alaq).
 * - `recommended`: the other sajdah ayat; the prostration is mustahabb.
 *
 * Sources (fiqh rulings; the ayah locations are checked against the bundled
 * text by the content integrity test):
 * - Obligatory four: al-Sayyid al-Yazdī, al-'Urwa al-Wuthqā, "Sujūd
 *   al-tilāwa"; al-Sayyid al-Khūmaynī, Taḥrīr al-Wasīla, "Ṣalāt", on the
 *   obligatory prostration at the four sajdah sūras; al-Ḥurr al-'Āmilī,
 *   Wasā'il al-Shī'a, chapter on prostration at the 'azā'im.
 * - Recommended ones: the same texts (mustahabb at the remaining sajdah ayat
 *   of the Quran) and the Sunni fifteen-ayah list in the Madinah mushaf.
 *
 * NEEDS SCHOLAR REVIEW before release:
 * - 41:37 vs 41:38. Ja'fari fiqh places the sajdah at "…if it is Him you
 *   worship" (41:37 in the Hafs count); the KFGQPC mushaf prints its ۩ sign at
 *   41:38 (the Shafi'i/Madinah convention). The marker here is on 41:37 only,
 *   and 41:38 carries none.
 * - 22:77 and 38:24 are listed as recommended, as in the Madinah list; confirm
 *   the marja's ruling on them.
 * - Exact volume, chapter and page citations were not checked against print.
 */
export type SajdahKind = "obligatory" | "recommended";

export interface Sajdah {
  /** `surah:ayah`, e.g. `32:15`. */
  ayah: `${number}:${number}`;
  kind: SajdahKind;
}

export const SAJDAH: readonly Sajdah[] = [
  { ayah: "7:206", kind: "recommended" },
  { ayah: "13:15", kind: "recommended" },
  { ayah: "16:50", kind: "recommended" },
  { ayah: "17:109", kind: "recommended" },
  { ayah: "19:58", kind: "recommended" },
  { ayah: "22:18", kind: "recommended" },
  { ayah: "22:77", kind: "recommended" },
  { ayah: "25:60", kind: "recommended" },
  { ayah: "27:26", kind: "recommended" },
  { ayah: "32:15", kind: "obligatory" },
  { ayah: "38:24", kind: "recommended" },
  { ayah: "41:37", kind: "obligatory" },
  { ayah: "53:62", kind: "obligatory" },
  { ayah: "84:21", kind: "recommended" },
  { ayah: "96:19", kind: "obligatory" },
];
