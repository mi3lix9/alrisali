export const ar = {
  title: "مشاركة صورة",
  action: {
    ayah: "مشاركة كصورة",
    supplication: "مشاركة مقطع كصورة",
    times: "مشاركة المواقيت كصورة",
  },
  size: {
    label: "المقاس",
    square: "١:١",
    portrait: "٤:٥",
    story: "٩:١٦",
  },
  background: {
    label: "الخلفية",
    white: "أبيض",
    sand: "رملي",
    black: "أسود",
    green: "أخضر",
    navy: "كحلي",
    maroon: "عنابي",
  },
  opener: {
    label: "في البداية",
    none: "لا شيء",
    bismillah: "البسملة",
    audhu: "الاستعاذة",
  },
  attribution: {
    label: "ذكر المصدر",
    description: "سطر صغير أسفل الصورة",
    line: "الرسالي · alrisali.com",
  },
  reference: {
    ayah: "سورة {{surah}} · {{ayah}}",
  },
  section: {
    label: "المقطع",
    position: "{{number}} من {{count}}",
    previous: "المقطع السابق",
    next: "المقطع التالي",
  },
  tooLong:
    "النص أطول من أن يتسع في هذا المقاس. اختر مقاسًا أطول أو أوقف ذكر المصدر.",
  unavailable: "تعذّر تجهيز هذه الصورة.",
  share: "مشاركة",
  sharing: "جارٍ تجهيز الصورة",
  failed: "تعذّرت مشاركة الصورة. حاول مرة أخرى.",
  preview: "معاينة الصورة",
} as const;
