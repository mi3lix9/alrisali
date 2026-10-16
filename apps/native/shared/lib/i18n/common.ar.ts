// The shell's own strings: tab names and the shared chrome. Features keep
// their strings in their own `i18n/` folder and namespace.
export const ar = {
  appName: "الرسالي",
  // The Feature Registry's labels: tabs, Home shortcuts and All Tools.
  features: {
    home: "الرئيسية",
    quran: "القرآن",
    prayer: "الصلاة",
    qibla: "القبلة",
    "prayer-assistant": "مساعد الصلاة",
    library: "المكتبة",
    lessons: "الدروس",
    worship: "العبادات",
    programs: "البرامج",
    tasbih: "التسبيح",
    calendar: "التقويم",
    gatherings: "المجالس",
    insights: "إحصاءاتي",
    khatmah: "الختمة",
  },
  featureAreas: {
    quran: "القرآن",
    prayer: "الصلاة",
    worship: "العبادات",
    library: "المكتبة",
    seasonal: "موسمي",
    more: "المزيد",
  },
  settings: "الإعدادات",
  account: "الحساب",
  // Separates the parts of one line: a middle dot after an Arabic-Indic number reads as a zero.
  separator: "، ",
  search: {
    label: "بحث",
    clear: "مسح البحث",
    noResults: "لا توجد نتائج.",
  },
  library: {
    searchPlaceholder: "ابحث في السور والأدعية والمواد",
  },
  // What Panel UI's controls say to VoiceOver (see AppProviders).
  controls: {
    closeSheet: "إغلاق النافذة",
    close: "إغلاق",
    dismissNotification: "إخفاء الإشعار",
    decrease: "إنقاص {{label}}",
    increase: "زيادة {{label}}",
    value: "القيمة",
    previousMonth: "الشهر السابق",
    nextMonth: "الشهر التالي",
    month: "الشهر",
    year: "السنة",
    hour: "الساعة",
    minute: "الدقيقة",
    amPm: "صباحًا أو مساءً",
    time: "الوقت",
  },
  notFound: {
    title: "الصفحة غير موجودة",
    goHome: "العودة إلى الرئيسية",
  },
  // Hijri Dates appear across features, so their wording is the shell's.
  hijri: {
    date: "{{day}} {{month}} {{year}} هـ",
    monthYear: "{{month}} {{year}} هـ",
    dayMonth: "{{day}} {{month}}",
    months: {
      muharram: "محرّم",
      safar: "صفر",
      rabiAlAwwal: "ربيع الأول",
      rabiAlThani: "ربيع الآخر",
      jumadaAlUla: "جمادى الأولى",
      jumadaAlAkhirah: "جمادى الآخرة",
      rajab: "رجب",
      shaban: "شعبان",
      ramadan: "رمضان",
      shawwal: "شوّال",
      dhuAlQadah: "ذو القعدة",
      dhuAlHijjah: "ذو الحجة",
    },
  },
  fileSize: {
    bytes: "{{value}} بايت",
    kb: "{{value}} ك.ب",
    mb: "{{value}} م.ب",
    gb: "{{value}} غ.ب",
  },
};
