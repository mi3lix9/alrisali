/** Text in both app languages. */
export interface Bilingual {
  ar: string;
  en: string;
}

/** Which Reminders a saying suits. */
export type SayingTopic = "salah" | "fajr" | "imsak";

/**
 * A scriptural saying that a Classic Reminder carries under its title, with
 * the source it comes from.
 */
export interface ClassicSaying {
  /** Stable: a scheduled Reminder names its saying by this id. */
  id: string;
  topic: SayingTopic;
  text: Bilingual;
  source: Bilingual;
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** A Qur'an citation, e.g. ("البقرة", "2:238"), with Arabic-Indic digits in Arabic. */
const quran = (surah: string, reference: string): Bilingual => ({
  ar: `سورة ${surah} ${reference.replaceAll(/\d/gu, (digit) => ARABIC_DIGITS.charAt(Number(digit)))}`,
  en: `Qur’an ${reference}`,
});

const PROPHET: Bilingual = { ar: "النبي محمد ﷺ", en: "Prophet Muhammad ﷺ" };
const IMAM_ALI: Bilingual = {
  ar: "الإمام علي (ع)، نهج البلاغة",
  en: "Imam Ali (ع), Nahj al-Balagha",
};
const IMAM_SADIQ: Bilingual = {
  ar: "الإمام جعفر الصادق (ع)",
  en: "Imam Ja‘far al-Sadiq (ع)",
};

// In the tone of the old app's Shia-aligned message library (Qur'an, the
// Prophet, the Imams), narrowed to prayer and fasting so each fits the
// Reminder it rides on. Never reuse an id.
export const CLASSIC_SAYINGS: readonly ClassicSaying[] = [
  {
    id: "guard-the-prayers",
    topic: "salah",
    text: {
      ar: "﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾",
      en: "“Guard the prayers, and the middle prayer, and stand before Allah in devotion.”",
    },
    source: quran("البقرة", "2:238"),
  },
  {
    id: "prayer-restrains",
    topic: "salah",
    text: {
      ar: "﴿إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ﴾",
      en: "“Indeed, prayer restrains from indecency and wrongdoing.”",
    },
    source: quran("العنكبوت", "29:45"),
  },
  {
    id: "patience-and-prayer",
    topic: "salah",
    text: {
      ar: "﴿وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ﴾",
      en: "“Seek help through patience and prayer.”",
    },
    source: quran("البقرة", "2:45"),
  },
  {
    id: "prayer-at-fixed-times",
    topic: "salah",
    text: {
      ar: "﴿إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا﴾",
      en: "“Indeed, prayer is prescribed for the believers at fixed times.”",
    },
    source: quran("النساء", "4:103"),
  },
  {
    id: "prayer-for-remembrance",
    topic: "salah",
    text: {
      ar: "﴿وَأَقِمِ الصَّلَاةَ لِذِكْرِي﴾",
      en: "“Establish prayer for My remembrance.”",
    },
    source: quran("طه", "20:14"),
  },
  {
    id: "humble-in-prayer",
    topic: "salah",
    text: {
      ar: "﴿قَدْ أَفْلَحَ الْمُؤْمِنُونَ ۝ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ﴾",
      en: "“Successful indeed are the believers, who are humble in their prayers.”",
    },
    source: quran("المؤمنون", "23:1–2"),
  },
  {
    id: "steadfast-in-prayer",
    topic: "salah",
    text: {
      ar: "﴿وَأْمُرْ أَهْلَكَ بِالصَّلَاةِ وَاصْطَبِرْ عَلَيْهَا﴾",
      en: "“Enjoin prayer on your family and be steadfast in it.”",
    },
    source: quran("طه", "20:132"),
  },
  {
    id: "pillar-of-religion",
    topic: "salah",
    text: {
      ar: "«الصلاة عمود الدين»",
      en: "“Prayer is the pillar of the religion.”",
    },
    source: PROPHET,
  },
  {
    id: "offering-of-the-pious",
    topic: "salah",
    text: {
      ar: "«الصلاة قربان كل تقي»",
      en: "“Prayer is the offering of every God-fearing one.”",
    },
    source: IMAM_ALI,
  },
  {
    id: "do-not-take-prayer-lightly",
    topic: "salah",
    text: {
      ar: "«إن شفاعتنا لا تنال مستخفًّا بالصلاة»",
      en: "“Our intercession does not reach one who takes prayer lightly.”",
    },
    source: IMAM_SADIQ,
  },
  {
    id: "dawn-recitation-witnessed",
    topic: "fajr",
    text: {
      ar: "﴿وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا﴾",
      en: "“And the recitation at dawn; indeed, the recitation at dawn is ever witnessed.”",
    },
    source: quran("الإسراء", "17:78"),
  },
  {
    id: "fasting-prescribed",
    topic: "imsak",
    text: {
      ar: "﴿يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ﴾",
      en: "“O you who believe, fasting is prescribed for you as it was prescribed for those before you, that you may be mindful of Allah.”",
    },
    source: quran("البقرة", "2:183"),
  },
  {
    id: "white-thread-of-dawn",
    topic: "imsak",
    text: {
      ar: "﴿وَكُلُوا وَاشْرَبُوا حَتَّىٰ يَتَبَيَّنَ لَكُمُ الْخَيْطُ الْأَبْيَضُ مِنَ الْخَيْطِ الْأَسْوَدِ مِنَ الْفَجْرِ﴾",
      en: "“Eat and drink until the white thread of dawn becomes distinct to you from the black thread.”",
    },
    source: quran("البقرة", "2:187"),
  },
];

/** A saying by id, or undefined for one this app does not know. */
export const classicSayingById = (id: string): ClassicSaying | undefined =>
  CLASSIC_SAYINGS.find((saying) => saying.id === id);
