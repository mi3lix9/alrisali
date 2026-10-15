import { z } from "zod";

import { hijriDaySchema, hijriMonthSchema } from "./hijri";
import type { HijriDate, HijriMonth } from "./hijri";

export const OCCASION_TYPES = [
  "celebration",
  "mourning",
  "religious",
  "fasting",
] as const;

export type OccasionType = (typeof OCCASION_TYPES)[number];

/** A recurring Hijri-dated commemoration, built in or added by the Admins. */
export const occasionSchema = z.object({
  id: z.string().min(1),
  month: hijriMonthSchema,
  day: hijriDaySchema,
  type: z.enum(OCCASION_TYPES),
  name: z.object({
    ar: z.string().trim().min(1),
    en: z.string().trim().min(1),
  }),
});

export type Occasion = z.infer<typeof occasionSchema>;

/** The Shia Occasions bundled with the app, by Hijri month and day. */
export const BUILT_IN_OCCASIONS: readonly Occasion[] = [
  {
    id: "islamic-new-year",
    month: 1,
    day: 1,
    type: "celebration",
    name: { ar: "رأس السنة الهجرية", en: "Islamic New Year" },
  },
  {
    id: "martyrdom-imam-hassan-opinion",
    month: 1,
    day: 7,
    type: "mourning",
    name: {
      ar: "شهادة الإمام الحسن (ع) - رواية",
      en: "Martyrdom of Imam Hassan (a.s) - one opinion",
    },
  },
  {
    id: "ashura",
    month: 1,
    day: 10,
    type: "mourning",
    name: {
      ar: "عاشوراء - شهادة الإمام الحسين (ع)",
      en: "Ashura - Martyrdom of Imam Hussain (a.s)",
    },
  },
  {
    id: "captivity-ahlulbayt",
    month: 1,
    day: 11,
    type: "mourning",
    name: {
      ar: "سبي أهل البيت إلى الكوفة",
      en: "Captivity of Ahlulbayt to Kufa",
    },
  },
  {
    id: "martyrdom-imam-sajjad",
    month: 1,
    day: 25,
    type: "mourning",
    name: {
      ar: "شهادة الإمام السجاد (ع)",
      en: "Martyrdom of Imam Sajjad (a.s)",
    },
  },
  {
    id: "birth-imam-musa-kadhim",
    month: 2,
    day: 7,
    type: "celebration",
    name: {
      ar: "ولادة الإمام موسى الكاظم (ع)",
      en: "Birth of Imam Musa al-Kadhim (a.s)",
    },
  },
  {
    id: "arbaeen",
    month: 2,
    day: 20,
    type: "mourning",
    name: {
      ar: "أربعين الإمام الحسين (ع)",
      en: "Arba'een - 40 days after Ashura",
    },
  },
  {
    id: "martyrdom-prophet",
    month: 2,
    day: 28,
    type: "mourning",
    name: {
      ar: "وفاة النبي محمد (ص)",
      en: "Martyrdom of Prophet Muhammad (s.a.w.a)",
    },
  },
  {
    id: "martyrdom-imam-hassan",
    month: 2,
    day: 28,
    type: "mourning",
    name: { ar: "شهادة الإمام الحسن (ع)", en: "Martyrdom of Imam Hassan (a.s)" },
  },
  {
    id: "martyrdom-imam-ridha",
    month: 2,
    day: 29,
    type: "mourning",
    name: {
      ar: "شهادة الإمام علي الرضا (ع)",
      en: "Martyrdom of Imam Ali al-Ridha (a.s)",
    },
  },
  {
    id: "martyrdom-imam-askari",
    month: 3,
    day: 8,
    type: "mourning",
    name: {
      ar: "شهادة الإمام الحسن العسكري (ع)",
      en: "Martyrdom of Imam Hassan al-Askari (a.s)",
    },
  },
  {
    id: "eid-zahra",
    month: 3,
    day: 9,
    type: "celebration",
    name: {
      ar: "عيد الزهراء - بداية إمامة الإمام المهدي (عج)",
      en: "Eid al-Zahra - Beginning of Imamate of Imam Mahdi (a.s)",
    },
  },
  {
    id: "birth-prophet",
    month: 3,
    day: 17,
    type: "celebration",
    name: {
      ar: "ولادة النبي محمد (ص)",
      en: "Birth of Prophet Muhammad (s.a.w.a)",
    },
  },
  {
    id: "birth-imam-sadiq",
    month: 3,
    day: 17,
    type: "celebration",
    name: {
      ar: "ولادة الإمام جعفر الصادق (ع)",
      en: "Birth of Imam Ja'far al-Sadiq (a.s)",
    },
  },
  {
    id: "birth-imam-askari",
    month: 4,
    day: 8,
    type: "celebration",
    name: {
      ar: "ولادة الإمام الحسن العسكري (ع)",
      en: "Birth of Imam Hassan al-Askari (a.s)",
    },
  },
  {
    id: "death-lady-masumah",
    month: 4,
    day: 10,
    type: "mourning",
    name: {
      ar: "وفاة السيدة فاطمة المعصومة (ع)",
      en: "Death of Lady Fatimah Ma'sumah (a.s)",
    },
  },
  {
    id: "birth-lady-zainab",
    month: 5,
    day: 5,
    type: "celebration",
    name: { ar: "ولادة السيدة زينب (ع)", en: "Birth of Lady Zainab (a.s)" },
  },
  {
    id: "martyrdom-lady-fatimah-1",
    month: 5,
    day: 13,
    type: "mourning",
    name: {
      ar: "شهادة السيدة فاطمة الزهراء (ع) - الرواية الأولى",
      en: "Martyrdom of Lady Fatimah (a.s) - 1st opinion",
    },
  },
  {
    id: "birth-imam-sajjad",
    month: 5,
    day: 15,
    type: "celebration",
    name: { ar: "ولادة الإمام السجاد (ع)", en: "Birth of Imam Sajjad (a.s)" },
  },
  {
    id: "martyrdom-lady-fatimah-2",
    month: 6,
    day: 3,
    type: "mourning",
    name: {
      ar: "شهادة السيدة فاطمة الزهراء (ع) - الرواية الثانية",
      en: "Martyrdom of Lady Fatimah (a.s) - 2nd opinion",
    },
  },
  {
    id: "birth-lady-fatimah",
    month: 6,
    day: 20,
    type: "celebration",
    name: {
      ar: "ولادة السيدة فاطمة الزهراء (ع)",
      en: "Birth of Lady Fatimah (a.s)",
    },
  },
  {
    id: "birth-imam-baqir",
    month: 7,
    day: 1,
    type: "celebration",
    name: {
      ar: "ولادة الإمام محمد الباقر (ع)",
      en: "Birth of Imam Muhammad al-Baqir (a.s)",
    },
  },
  {
    id: "martyrdom-imam-hadi",
    month: 7,
    day: 3,
    type: "mourning",
    name: {
      ar: "شهادة الإمام علي الهادي (ع)",
      en: "Martyrdom of Imam Ali al-Hadi (a.s)",
    },
  },
  {
    id: "birth-imam-jawad",
    month: 7,
    day: 10,
    type: "celebration",
    name: {
      ar: "ولادة الإمام محمد الجواد (ع)",
      en: "Birth of Imam Muhammad al-Jawad (a.s)",
    },
  },
  {
    id: "birth-imam-ali",
    month: 7,
    day: 13,
    type: "celebration",
    name: { ar: "ولادة الإمام علي (ع)", en: "Birth of Imam Ali (a.s)" },
  },
  {
    id: "death-lady-zainab",
    month: 7,
    day: 15,
    type: "mourning",
    name: { ar: "وفاة السيدة زينب (ع)", en: "Death of Lady Zainab (a.s)" },
  },
  {
    id: "martyrdom-imam-kadhim",
    month: 7,
    day: 25,
    type: "mourning",
    name: {
      ar: "شهادة الإمام موسى الكاظم (ع)",
      en: "Martyrdom of Imam Musa al-Kadhim (a.s)",
    },
  },
  {
    id: "mabath",
    month: 7,
    day: 27,
    type: "celebration",
    name: {
      ar: "المبعث النبوي الشريف",
      en: "Mab'ath - Beginning of Prophethood",
    },
  },
  {
    id: "birth-imam-hussain",
    month: 8,
    day: 3,
    type: "celebration",
    name: { ar: "ولادة الإمام الحسين (ع)", en: "Birth of Imam Hussain (a.s)" },
  },
  {
    id: "birth-abbas",
    month: 8,
    day: 4,
    type: "celebration",
    name: {
      ar: "ولادة أبي الفضل العباس (ع)",
      en: "Birth of Abbas ibn Ali (a.s)",
    },
  },
  {
    id: "birth-ali-akbar",
    month: 8,
    day: 5,
    type: "celebration",
    name: { ar: "ولادة علي الأكبر (ع)", en: "Birth of Imam Ali al-Akbar (a.s)" },
  },
  {
    id: "birth-ali-asghar",
    month: 8,
    day: 11,
    type: "celebration",
    name: { ar: "ولادة علي الأصغر (ع)", en: "Birth of Ali al-Asghar (a.s)" },
  },
  {
    id: "birth-imam-mahdi",
    month: 8,
    day: 15,
    type: "celebration",
    name: { ar: "ولادة الإمام المهدي (عج)", en: "Birth of Imam al-Mahdi (a.s)" },
  },
  {
    id: "beginning-ramadan",
    month: 9,
    day: 1,
    type: "celebration",
    name: {
      ar: "بداية شهر رمضان المبارك",
      en: "Beginning of Holy Month of Ramadan",
    },
  },
  {
    id: "death-lady-khadijah",
    month: 9,
    day: 10,
    type: "mourning",
    name: { ar: "وفاة السيدة خديجة (ع)", en: "Death of Lady Khadijah (a.s)" },
  },
  {
    id: "birth-imam-hassan",
    month: 9,
    day: 15,
    type: "celebration",
    name: { ar: "ولادة الإمام الحسن (ع)", en: "Birth of Imam Hassan (a.s)" },
  },
  {
    id: "first-night-qadr",
    month: 9,
    day: 19,
    type: "mourning",
    name: {
      ar: "ليلة القدر الأولى / جرح الإمام علي (ع)",
      en: "First Night of Qadr / Injury of Imam Ali (a.s)",
    },
  },
  {
    id: "martyrdom-imam-ali",
    month: 9,
    day: 21,
    type: "mourning",
    name: {
      ar: "شهادة الإمام علي (ع) / ليلة القدر الثانية",
      en: "Martyrdom of Imam Ali (a.s) / Second Night of Qadr",
    },
  },
  {
    id: "third-night-qadr",
    month: 9,
    day: 23,
    type: "celebration",
    name: {
      ar: "ليلة القدر الثالثة",
      en: "Third Night of Qadr (Laylat al-Qadr)",
    },
  },
  {
    id: "eid-fitr",
    month: 10,
    day: 1,
    type: "celebration",
    name: { ar: "عيد الفطر", en: "Eid al-Fitr" },
  },
  {
    id: "martyrdom-imam-sadiq",
    month: 10,
    day: 25,
    type: "mourning",
    name: {
      ar: "شهادة الإمام جعفر الصادق (ع)",
      en: "Martyrdom of Imam Ja'far al-Sadiq (a.s)",
    },
  },
  {
    id: "birth-lady-masumah",
    month: 11,
    day: 1,
    type: "celebration",
    name: {
      ar: "ولادة السيدة فاطمة المعصومة (ع)",
      en: "Birth of Lady Fatimah Ma'sumah (a.s)",
    },
  },
  {
    id: "birth-imam-ridha",
    month: 11,
    day: 11,
    type: "celebration",
    name: {
      ar: "ولادة الإمام علي الرضا (ع)",
      en: "Birth of Imam Ali al-Ridha (a.s)",
    },
  },
  {
    id: "dahw-al-ard",
    month: 11,
    day: 25,
    type: "celebration",
    name: {
      ar: "يوم دحو الأرض",
      en: "Day of Dahw al-Ard (Spreading of the Earth)",
    },
  },
  {
    id: "martyrdom-imam-jawad",
    month: 11,
    day: 29,
    type: "mourning",
    name: {
      ar: "شهادة الإمام محمد الجواد (ع)",
      en: "Martyrdom of Imam Muhammad al-Jawad (a.s)",
    },
  },
  {
    id: "martyrdom-imam-baqir",
    month: 12,
    day: 7,
    type: "mourning",
    name: {
      ar: "شهادة الإمام محمد الباقر (ع)",
      en: "Martyrdom of Imam Muhammad al-Baqir (a.s)",
    },
  },
  {
    id: "day-arafah",
    month: 12,
    day: 9,
    type: "celebration",
    name: { ar: "يوم عرفة", en: "Day of Arafah" },
  },
  {
    id: "eid-adha",
    month: 12,
    day: 10,
    type: "celebration",
    name: { ar: "عيد الأضحى", en: "Eid al-Adha" },
  },
  {
    id: "birth-imam-hadi",
    month: 12,
    day: 15,
    type: "celebration",
    name: {
      ar: "ولادة الإمام علي الهادي (ع)",
      en: "Birth of Imam Ali al-Hadi (a.s)",
    },
  },
  {
    id: "eid-ghadir",
    month: 12,
    day: 18,
    type: "celebration",
    name: { ar: "عيد الغدير", en: "Eid al-Ghadir" },
  },
  {
    id: "eid-mubahila",
    month: 12,
    day: 24,
    type: "celebration",
    name: { ar: "عيد المباهلة", en: "Eid al-Mubahila" },
  },
];

/** The day an Occasion falls on in a month: the 30th moves to a 29th. */
const dayInMonth = (occasion: Occasion, monthLength: number) =>
  Math.min(occasion.day, monthLength);

/** The Occasions on a Hijri Date, in the order given. */
export const occasionsOn = (
  date: HijriDate,
  monthLength: number,
  occasions: readonly Occasion[]
): Occasion[] =>
  occasions.filter(
    (occasion) =>
      occasion.month === date.month &&
      dayInMonth(occasion, monthLength) === date.day
  );

export interface OccasionDay {
  day: number;
  occasions: Occasion[];
}

/** A month's days that have Occasions, in day order. */
export const occasionsInMonth = (
  month: HijriMonth,
  monthLength: number,
  occasions: readonly Occasion[]
): OccasionDay[] =>
  Array.from({ length: monthLength }, (_, index) => ({
    day: index + 1,
    occasions: occasions.filter(
      (occasion) =>
        occasion.month === month &&
        dayInMonth(occasion, monthLength) === index + 1
    ),
  })).filter(({ occasions: onDay }) => onDay.length > 0);
