// The shell's own strings: tab names and the shared chrome. Features keep
// their strings in their own `i18n/` folder and namespace.
export const ar = {
  appName: "الرسالي",
  tabs: {
    home: "الرئيسية",
    prayer: "الصلاة",
    library: "المكتبة",
    worship: "العبادات",
    tasbih: "التسبيح",
  },
  settings: "الإعدادات",
  account: "الحساب",
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
};
