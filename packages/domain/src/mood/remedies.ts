import type { Mood } from "./moods";

/** Text in both app languages. */
export interface Bilingual {
  ar: string;
  en: string;
}

/** A saying or dua offered in answer to a Mood Check-in. */
export interface Remedy {
  /** Stable: a saved Mood Check-in refers to its Remedy by this id. */
  id: string;
  mood: Mood;
  text: Bilingual;
  /** Where the saying comes from; null for a plain dhikr suggestion. */
  source: Bilingual | null;
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** A Qur'an citation, e.g. ("البقرة", "2:153"), with Arabic-Indic digits in Arabic. */
const quran = (surah: string, reference: string): Bilingual => ({
  ar: `سورة ${surah} ${reference.replaceAll(/\d/gu, (digit) => ARABIC_DIGITS.charAt(Number(digit)))}`,
  en: `Qur’an ${reference}`,
});

const PROPHET: Bilingual = { ar: "النبي محمد ﷺ", en: "Prophet Muhammad ﷺ" };

// Built from the old app's duaRemedies and the mood themes of its saying
// library (lib/notification-data getSayingForMood), with the Arabic text
// restored. Never remove or reuse an id: saved check-ins point at it.
export const REMEDIES: readonly Remedy[] = [
  {
    id: "happy-alhamdulillah",
    mood: "happy",
    text: {
      ar: "اقرأ «الحمد لله» شكرًا لله على نعمه.",
      en: "Recite Alhamdulillah in gratitude for His blessings.",
    },
    source: null,
  },
  {
    id: "happy-gratitude-increases",
    mood: "happy",
    text: {
      ar: "﴿لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ﴾",
      en: "“If you are grateful, I will surely give you more.”",
    },
    source: quran("إبراهيم", "14:7"),
  },
  {
    id: "happy-excellence",
    mood: "happy",
    text: {
      ar: "﴿وَأَحْسِنُوا إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ﴾",
      en: "“Do good; indeed Allah loves those who do good.”",
    },
    source: quran("البقرة", "2:195"),
  },
  {
    id: "happy-consistent-deeds",
    mood: "happy",
    text: {
      ar: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ مَا دَاوَمَ عَلَيْهِ الْعَبْدُ وَإِنْ قَلَّ.",
      en: "The most beloved deeds to Allah are those a servant keeps up, even if they are small.",
    },
    source: PROPHET,
  },
  {
    id: "calm-subhanallah",
    mood: "calm",
    text: {
      ar: "اقرأ «سبحان الله» للتأمل.",
      en: "Recite SubhanAllah for mindfulness.",
    },
    source: null,
  },
  {
    id: "calm-hearts-at-rest",
    mood: "calm",
    text: {
      ar: "﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾",
      en: "“Surely in the remembrance of Allah do hearts find rest.”",
    },
    source: quran("الرعد", "13:28"),
  },
  {
    id: "calm-mindful-of-allah",
    mood: "calm",
    text: {
      ar: "﴿فَاتَّقُوا اللَّهَ مَا اسْتَطَعْتُمْ﴾",
      en: "“Be mindful of Allah as much as you are able.”",
    },
    source: quran("التغابن", "64:16"),
  },
  {
    id: "calm-balance",
    mood: "calm",
    text: {
      ar: "﴿وَابْتَغِ فِيمَا آتَاكَ اللَّهُ الدَّارَ الْآخِرَةَ وَلَا تَنسَ نَصِيبَكَ مِنَ الدُّنْيَا﴾",
      en: "“Seek the Hereafter through what Allah has given you, and do not forget your share of this world.”",
    },
    source: quran("القصص", "28:77"),
  },
  {
    id: "sad-istirja",
    mood: "sad",
    text: {
      ar: "اقرأ «إنا لله وإنا إليه راجعون» للصبر.",
      en: "Recite ‘Inna lillahi wa inna ilayhi raji‘un’ for patience.",
    },
    source: quran("البقرة", "2:156"),
  },
  {
    id: "sad-hardship-ease",
    mood: "sad",
    text: {
      ar: "﴿فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾",
      en: "“So surely with hardship comes ease. Surely with hardship comes ease.”",
    },
    source: quran("الشرح", "94:5–6"),
  },
  {
    id: "sad-patience-and-prayer",
    mood: "sad",
    text: {
      ar: "﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ﴾",
      en: "“O you who believe, seek help through patience and prayer; Allah is with the patient.”",
    },
    source: quran("البقرة", "2:153"),
  },
  {
    id: "sad-do-not-despair",
    mood: "sad",
    text: {
      ar: "﴿وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ﴾",
      en: "“Do not despair of relief from Allah.”",
    },
    source: quran("يوسف", "12:87"),
  },
  {
    id: "stressed-al-inshirah",
    mood: "stressed",
    text: {
      ar: "اقرأ سورة الشرح للراحة.",
      en: "Recite Surah Al-Inshirah for relief.",
    },
    source: quran("الشرح", "94"),
  },
  {
    id: "stressed-within-capacity",
    mood: "stressed",
    text: {
      ar: "﴿لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا﴾",
      en: "“Allah does not burden a soul beyond what it can bear.”",
    },
    source: quran("البقرة", "2:286"),
  },
  {
    id: "stressed-trust-in-allah",
    mood: "stressed",
    text: {
      ar: "﴿وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ﴾",
      en: "“Whoever puts their trust in Allah, He is enough for them.”",
    },
    source: quran("الطلاق", "65:3"),
  },
  {
    id: "stressed-hasbunallah",
    mood: "stressed",
    text: {
      ar: "اقرأ «حسبنا الله ونعم الوكيل».",
      en: "Recite ‘Hasbunallahu wa ni‘mal wakil’: Allah is enough for us, and He is the best guardian.",
    },
    source: quran("آل عمران", "3:173"),
  },
  {
    id: "angry-isti'adha",
    mood: "angry",
    text: {
      ar: "اقرأ «أعوذ بالله من الشيطان الرجيم».",
      en: "Recite ‘A‘udhu billahi min ash-shaytan ir-rajim’: I seek refuge in Allah from Satan, the accursed.",
    },
    source: null,
  },
  {
    id: "angry-restrain-anger",
    mood: "angry",
    text: {
      ar: "﴿وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ﴾",
      en: "“Those who restrain their anger and pardon people; Allah loves those who do good.”",
    },
    source: quran("آل عمران", "3:134"),
  },
  {
    id: "angry-pardon",
    mood: "angry",
    text: {
      ar: "﴿فَمَنْ عَفَا وَأَصْلَحَ فَأَجْرُهُ عَلَى اللَّهِ﴾",
      en: "“Whoever pardons and makes peace, their reward is with Allah.”",
    },
    source: quran("الشورى", "42:40"),
  },
  {
    id: "angry-spoils-faith",
    mood: "angry",
    text: {
      ar: "الْغَضَبُ يُفْسِدُ الْإِيمَانَ كَمَا يُفْسِدُ الْخَلُّ الْعَسَلَ.",
      en: "Anger spoils faith as vinegar spoils honey.",
    },
    source: PROPHET,
  },
];

/** Every Remedy offered for the mood, in a fixed order. */
export const remediesFor = (mood: Mood): readonly Remedy[] =>
  REMEDIES.filter((remedy) => remedy.mood === mood);

/** The Remedy with this id, or null when this app does not know it. */
export const remedyById = (id: string): Remedy | null =>
  REMEDIES.find((remedy) => remedy.id === id) ?? null;

/**
 * One of the mood's Remedies, chosen by `random` (a number in [0, 1), like
 * Math.random) so that each check-in may offer a different one.
 */
export const pickRemedy = (
  mood: Mood,
  random: () => number = Math.random
): Remedy => {
  const remedies = remediesFor(mood);
  const index = Math.min(
    Math.floor(random() * remedies.length),
    remedies.length - 1
  );
  const remedy = remedies[index];
  if (!remedy) {
    throw new Error(`No Remedy for the mood "${mood}"`);
  }
  return remedy;
};
