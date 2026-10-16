export const progressAr = {
  continue: {
    label: "الختمة",
  },
  reschedule: {
    action: "إعادة الجدولة",
    title: "إعادة جدولة الختمة",
    description: "اختر كيف تلحق بما فاتك.",
    extendEnd: {
      title: "أجّل تاريخ الانتهاء",
      description: "يبقى حجم الورد كما هو، ويُؤخَّر تاريخ الانتهاء.",
    },
    keepEnd: {
      title: "أبقِ تاريخ الانتهاء",
      description: "يكبر الورد المتبقي لتنتهي في التاريخ نفسه.",
    },
    finish: "تنتهي في {{hijri}} ({{gregorian}})",
    remaining: "{{n}} جلسة متبقية، نحو {{pages}} صفحة لكل جلسة",
    unavailable: "انقضى تاريخ الانتهاء، فلا يمكن إبقاؤه.",
    done: "أُعيدت جدولة الختمة.",
    error: "تعذّرت إعادة الجدولة. حاول مرة أخرى.",
    cancel: "إلغاء",
  },
  markTill: {
    title: "أتممت القراءة حتى…",
    page: "نهاية هذه الصفحة",
    ayah: "هذه الآية",
    portion: "نهاية الورد",
    done: "حُفظ تقدّمك. تقبّل الله.",
    error: "تعذّر الحفظ. حاول مرة أخرى.",
  },
  celebration: {
    title: "ما شاء الله، أتممت الختمة!",
    description: "تقبّل الله منك. أتممتها في {{days}} يوم.",
    dua: "دعاء ختم القرآن",
    repeat: "كرّر الخطة نفسها",
    startNew: "ابدأ ختمة جديدة",
    repeatError: "تعذّر بدء الختمة. حاول مرة أخرى.",
  },
  history: {
    title: "الختمات المكتملة",
    entry: "{{date}} · {{days}} يوم",
    chart: "صفحات كل جلسة",
    bar: "الجلسة {{session}}: {{pages}} صفحة",
  },
};
