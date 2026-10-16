// In-house Khatmah "by meaning" divisions of the Quran (written for Alrisali,
// not copied from any app or book). Each division lists the first ayah of
// every session; a session runs to the ayah before the next one starts, and
// the last runs to 114:6.
//
// 7 days: the seven classical manzil, the long-established weekly division
// ("fa-mi bishawq"): Al-Fatihah–An-Nisa, Al-Ma'idah–At-Tawbah,
// Yunus–An-Nahl, Al-Isra–Al-Furqan, Ash-Shu'ara–Ya-Sin, As-Saffat–Al-Hujurat,
// Qaf–An-Nas. Every one ends at a surah's end.
//
// 29 and 60 days: the surah starts nearest to an even split of the 604 Quran
// Pages, so a session ends at a surah's end whenever one lies within half a
// session's length of the even point; otherwise it ends at the end of a hizb
// quarter (the mushaf's own marked break; a juz boundary is one of them).
//
// SCHOLAR REVIEW PENDING: the 29- and 60-day divisions are a mechanical best
// fit, not yet reviewed by a scholar for thematic sense. Do not describe them
// as reviewed until `SCHOLAR_REVIEWED` is set.
type AyahKey = `${number}:${number}`;

/** The by-meaning plan lengths, in days (sessions). */
export const BY_MEANING_DAYS = [7, 29, 60] as const;
export type ByMeaningDays = (typeof BY_MEANING_DAYS)[number];

/** Whether a scholar has reviewed the 29- and 60-day divisions. */
export const SCHOLAR_REVIEWED: Record<ByMeaningDays, boolean> = {
  7: true,
  29: false,
  60: false,
};

/** The first ayah of each session, per plan length. */
export const BY_MEANING_STARTS: Record<ByMeaningDays, readonly AyahKey[]> = {
  7: ["1:1", "5:1", "10:1", "17:1", "26:1", "37:1", "50:1"],
  29: [
    "1:1", "2:142", "3:1", "3:113", "4:1", "5:1", "6:1", "7:1", "8:1", "9:1",
    "10:1", "12:1", "13:1", "16:1", "18:1", "20:1", "22:1", "25:1", "27:1",
    "29:1", "33:1", "36:1", "39:1", "41:1", "46:1", "51:1", "58:1", "68:1",
    "79:1",
  ],
  60: [
    "1:1", "2:75", "2:142", "2:203", "2:253", "3:1", "3:93", "3:171", "4:1",
    "4:88", "5:1", "5:27", "5:82", "6:1", "6:111", "7:1", "7:88", "8:1",
    "9:1", "9:34", "9:93", "10:1", "11:1", "12:1", "12:53", "14:1", "15:1",
    "16:51", "17:1", "18:1", "19:1", "20:1", "21:1", "22:1", "23:1", "24:1",
    "25:1", "27:1", "28:1", "29:1", "30:1", "32:1", "34:1", "35:1", "37:1",
    "38:1", "40:1", "41:1", "42:1", "44:1", "46:1", "49:1", "52:1", "56:1",
    "59:1", "63:1", "68:1", "73:1", "80:1", "91:1",
  ],
};
