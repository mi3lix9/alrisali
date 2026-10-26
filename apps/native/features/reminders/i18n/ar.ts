export const ar = {
  names: {
    imsak: "الإمساك",
    fajr: "الفجر",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء",
  },
  // Plural forms of "N minutes", picked with Intl.PluralRules.
  minutes: {
    zero: "{{count}} دقيقة",
    one: "دقيقة واحدة",
    two: "دقيقتين",
    few: "{{count}} دقائق",
    many: "{{count}} دقيقة",
    other: "{{count}} دقيقة",
  },
  notification: {
    salahBefore: "صلاة {{name}} بعد {{minutes}}",
    salahNow: "حان الآن وقت صلاة {{name}}",
    imsakBefore: "الإمساك بعد {{minutes}}",
    imsakNow: "حان الآن وقت الإمساك",
    saying: "{{text}}\n— {{source}}",
    habit: {
      classic:
        "«أحبّ الأعمال إلى الله عزّ وجلّ ما داوم عليه العبد وإن قلّ»\n— الإمام الصادق (ع)، الكافي",
      modern: "خطوة صغيرة اليوم تبني عادتك. حان وقتها.",
    },
    modern: {
      fajr: "بداية جديدة تنتظرك. ابدأ صباحك بلقاء الله.",
      dhuhr: "خذ استراحة قصيرة من يومك، وجدّد صلتك بالله.",
      asr: "قبل أن يمضي النهار، امنح نفسك دقائق من السكينة.",
      maghrib: "انتهى النهار. اختمه بصلاة تريح قلبك.",
      isha: "اختم يومك بهدوء، وسلّم أمرك لله قبل النوم.",
      imsak: "أنهِ سحورك وجدّد نيّتك، صيامًا مقبولًا بإذن الله.",
    },
  },
  screen: {
    intro:
      "تصلك التنبيهات من جهازك نفسه، ولو دون اتصال، وفق مواقيت موقعك والمنطقة الزمنية لجهازك.",
    noLocation: "حدّد موقعك في الإعدادات لتصلك تنبيهات الصلاة.",
    denied:
      "الإشعارات غير مسموح بها لهذا التطبيق، فلن تصلك التنبيهات. اسمح بها من إعدادات الجهاز.",
    openSettings: "فتح إعدادات الجهاز",
    allow: "السماح بالإشعارات",
    exactAlarms:
      "قد يؤخّر أندرويد التنبيهات دقائق ما لم تسمح للتطبيق بضبط المنبّهات في وقتها.",
    allowExactAlarms: "السماح بالتنبيه في الوقت تمامًا",
    salahTitle: "تنبيهات الصلاة",
    imsakTitle: "تنبيه الإمساك",
    imsakDescription: "يصلك عند وقت الإمساك، فلا يفوتك بدء الصيام.",
  },
  bell: {
    label: "{{name}}: {{state}}",
    off: "التنبيه متوقف",
    tone: "التنبيه مفعّل",
    silent: "التنبيه صامت",
    adhan: "التنبيه بصوت الأذان",
  },
  rule: {
    sound: "الصوت",
    adhan: "الأذان",
    minutesBefore: "قبل الوقت بـ (دقائق)",
    adhanOption: "{{muezzin}}: {{form}}",
    adhanForms: {
      takbeer: "التكبير فقط",
      full: "الأذان كاملاً",
    },
    muezzins: {
      hatamzadeh: "سعيد حاتم‌زاده ورمزيار",
      sobhdel: "حسين صبحدل",
    },
    adhanIosHint:
      "على الآيفون يقتصر الصوت على التكبير حتى لو اخترت الأذان كاملاً، لأن iOS يحدّ صوت الإشعار بثلاثين ثانية.",
    sounds: {
      default: "صوت النظام",
      chime: "رنين",
      bell: "جرس",
    },
  },
  alertType: {
    title: "نوع التنبيه",
    types: {
      off: "متوقف",
      silent: "صامت",
      tone: "نغمة",
      adhan: "أذان",
    },
    hints: {
      off: "لن يصلك تنبيه لهذا الوقت.",
      silent: "يظهر التنبيه دون صوت.",
      tone: "نغمة قصيرة مع الإشعار.",
      adhan: "يُسمع الأذان بدل النغمة.",
    },
  },
  sheet: {
    back: "رجوع",
    willHear: "سيصلك",
    timing: "التوقيت",
    onTime: "عند الوقت",
    beforeShort: "قبل بـ {{minutes}}",
    preview: "استمع إلى {{sound}}",
    stopPreview: "إيقاف {{sound}}",
  },
  summary: {
    off: "لن يصلك تنبيه {{name}}.",
    silent: "إشعار صامت",
    tone: "نغمة {{sound}}",
    toneDefault: "صوت النظام",
    adhanFull: "أذان {{muezzin}} كاملاً",
    adhanTakbeer: "تكبير الأذان بصوت {{muezzin}}",
    before: "قبل {{name}} بـ {{minutes}}",
    at: "عند دخول وقت {{name}}",
    line: "{{sound}} {{timing}}",
  },
  quietHours: {
    title: "ساعات الهدوء",
    description:
      "لا تصلك فيها التنبيهات غير الأساسية. تنبيهات الصلاة والإمساك تصلك دائمًا.",
    enabled: "تفعيل ساعات الهدوء",
    start: "من",
    end: "إلى",
  },
};
