import type { ContentSourceId } from "@alrisali/content";

import type { SoftwareCreditId } from "../data/software-credits";

// Every content source and software credit needs its line: a source added to
// `@alrisali/content` without one fails type-check here.
const credits = {
  kfgqpc:
    "نص القرآن الكريم برواية حفص، وصفحات المصحف وأسطرها، والخط العثماني، من الإصدار المخصص للمطورين من مجمع الملك فهد لطباعة المصحف الشريف.",
  thaqalayn:
    "النصوص العربية والترجمات الإنجليزية لمفاتيح الجنان والصحيفة السجادية ونهج البلاغة، من مكتبة ثقلين، مع إعادة تنسيقها للقراءة دون اتصال. لا يعني ذلك تأييد ثقلين للتطبيق.",
  "alquran-cloud":
    "التلاوات الصوتية وآية اليوم عبر alquran.cloud / Islamic Network، تُبَثّ مباشرةً إلى الجهاز. حقوق التسجيلات محفوظة للقرّاء.",
  everyayah:
    "تلاوات قرّاء لا يوفّرها alquran.cloud، مثل المنشاوي وعبد الباسط (مجوّد)، عبر EveryAyah.com. حقوق التسجيلات محفوظة للقرّاء.",
  "adhan-recording":
    "صوت الأذان في تنبيهات الصلاة: أذان شيعي في دستگاه ماهور بصوت سعيد حاتم‌زاده ورمزيار من ويكيميديا كومنز، بترخيص CC BY-SA 4.0، مطلعه (التكبير) وكاملاً، بعد التقصير والتحويل.",
  "adhan-sobhdel":
    "صوت الأذان في تنبيهات الصلاة: أذان شيعي بصوت المؤذن الحاج حسين صبحدل رحمه الله (فيديو كوروش عروج) من ويكيميديا كومنز، بترخيص CC BY-SA 4.0، مطلعه (التكبير) وكاملاً، بعد استخراج الصوت وتقصيره وتحويله.",
  tanzil:
    "بدايات أرباع الأحزاب من بيانات Tanzil الوصفية للقرآن، مصحَّحة على علامات الأرباع في نص مجمع الملك فهد.",
  wmm: "الانحراف المغناطيسي الذي تُصحَّح به بوصلة القبلة إلى الشمال الحقيقي، من النموذج المغناطيسي العالمي WMM2025 الصادر عن NOAA والمسح الجيولوجي البريطاني، وهو ملك عام.",
  "timezone-boundaries":
    "حدود المناطق الزمنية التي تُعرض بها مواقيت الصلاة على توقيت المكان المختار، من timezone-boundary-builder عبر مكتبة ‎@photostructure/tz-lookup، ببيانات OpenStreetMap ‏(© OpenStreetMap contributors) بترخيص ODbL 1.0.",
  "panel-ui": "مكوّنات واجهة التطبيق.",
  "open-source":
    "بُني التطبيق على Expo وReact Native ومكتبات مفتوحة المصدر أخرى، لكلٍّ منها ترخيصه. شيفرة الرسالي نفسها مرخّصة بترخيص MIT.",
  amiri: "خط أميري (نسخ) في قارئ الأدعية، بترخيص SIL Open Font License 1.1.",
  "ibm-plex-sans-arabic":
    "خط IBM Plex Sans Arabic في قارئ الأدعية، بترخيص SIL Open Font License 1.1.",
} satisfies Record<ContentSourceId | SoftwareCreditId, string>;

export const ar = {
  language: {
    title: "اللغة",
    description: "تُطبَّق اللغة واتجاه الواجهة عند إعادة تشغيل التطبيق.",
    ar: "العربية",
    en: "English",
    restartNow: "إعادة التشغيل الآن",
  },
  theme: {
    title: "المظهر",
    system: "حسب النظام",
    light: "فاتح",
    dark: "داكن",
  },
  location: {
    title: "الموقع",
    description: "تُحسب أوقات الصلاة لهذا الموقع.",
    notSet: "لم تحدّد موقعك بعد.",
    name: "اسم المكان (اختياري)",
    latitude: "خط العرض",
    longitude: "خط الطول",
    invalid:
      "خط العرض بين ‎-{{latitude}} و{{latitude}}، وخط الطول بين ‎-{{longitude}} و{{longitude}}.",
    timeZone: "المنطقة الزمنية: {{timeZone}}",
    save: "حفظ الموقع",
  },
  calculationMethod: {
    title: "طريقة الحساب",
    description: "القواعد التي تُحسب بها أوقات الصلاة.",
    jafari: "الجعفري",
    sunni: "السنّي",
    hanafi: "الحنفي",
    ibadi: "الإباضي",
    leva: "معهد ليفا، قم",
    tehran: "معهد الجيوفيزياء، طهران",
    ithnaAshari: "الاثنا عشري",
    alHadiBahrain: "الهادي، البحرين",
    mwl: "رابطة العالم الإسلامي",
    isna: "ISNA (أمريكا الشمالية)",
    egypt: "الهيئة المصرية العامة للمساحة",
    karachi: "كراتشي",
    ummAlQura: "أم القرى، مكة المكرمة",
    custom: "مخصّص",
    groups: { shia: "الشيعة", sunni: "السنّة", other: "أخرى" },
  },
  prayerSettings: {
    title: "إعدادات الصلاة",
    description: "كيف تُحسب أوقات الصلاة.",
    open: "طريقة الحساب والزوايا",
    jafariIsha:
      "تعتمد العشاء الجعفرية زاوية ١٧°، ومرجعها قيد التأكيد، وقد تتغيّر.",
  },
  customAngles: {
    title: "متقدّم: زوايا مخصّصة",
    description: "تُستخدم عند اختيار «مخصّص» أعلاه.",
    descriptionActive: "«مخصّص» مختار: هذه الزوايا تحدّد أوقات صلاتك.",
    fajr: "زاوية الفجر، {{min}}–{{max}}°",
    maghrib: "زاوية المغرب، {{min}}–{{max}}° (٠ هو الغروب)",
    isha: "زاوية العشاء، {{min}}–{{max}}°",
    invalid: "أدخل زوايا ضمن النطاقات المعروضة.",
    save: "حفظ الزوايا",
  },
  prayerAdjustments: {
    title: "تعديل الأوقات بالدقائق",
    description:
      "أضف أو اطرح حتى ٣٠ دقيقة من أي وقت. يُطبَّق التعديل مرة واحدة على الوقت كما يظهر، ولا يتغيّر مع تغيير الساعة الصيفية.",
    label: "{{name}}، بالدقائق",
    names: {
      imsak: "الإمساك",
      fajr: "الفجر",
      sunrise: "الشروق",
      dhuhr: "الظهر",
      asr: "العصر",
      sunset: "الغروب",
      maghrib: "المغرب",
      isha: "العشاء",
      midnight: "منتصف الليل",
    },
  },
  midnightDefinition: {
    title: "تعريف منتصف الليل",
    description: "الليل الذي يُنصَّف لحساب منتصف الليل.",
    sunsetToFajr: "من الغروب إلى الفجر",
    sunsetToSunrise: "من الغروب إلى الشروق",
    maghribToFajr: "من المغرب إلى الفجر",
    maghribToSunrise: "من المغرب إلى الشروق",
  },
  highLatitudeRule: {
    title: "قاعدة العروض العليا",
    description:
      "تحدّد الفجر والعشاء حيث لا تبلغ الشمس زاويتهما أو يقصر الليل، كصيف المدن الشمالية.",
    angleBased: "حسب الزاوية (الافتراضي)",
    oneSeventh: "سُبع الليل",
    middleOfNight: "منتصف الليل",
  },
  hijriAdjustment: {
    title: "تعديل التاريخ الهجري",
    description:
      "قدّم التاريخ الهجري أو أخّره حتى يومين ليوافق رؤية الهلال التي تتّبعها. يُطبَّق على كل تاريخ هجري في التطبيق.",
    today: "اليوم: {{date}}",
    minus2: "تأخير يومين",
    minus1: "تأخير يوم",
    none: "دون تعديل",
    plus1: "تقديم يوم",
    plus2: "تقديم يومين",
  },
  reminders: {
    title: "تنبيهات الصلاة",
    description: "التنبيه قبل كل صلاة وعند الإمساك، وساعات الهدوء.",
    open: "إعدادات التنبيهات",
  },
  messageStyle: {
    title: "أسلوب الرسائل",
    description: "الصوت الذي يحدّثك به التطبيق في التنبيهات وغيرها.",
    classic: "كلاسيكي",
    classicHint: "آيات وأحاديث مع مصادرها.",
    modern: "عصري",
    modernHint: "تشجيع لطيف وتحفيز.",
  },
  textSize: {
    title: "حجم الخط",
    small: "صغير",
    default: "افتراضي",
    large: "كبير",
    larger: "أكبر",
    preview: "بسم الله الرحمن الرحيم",
  },
  digits: {
    title: "الأرقام",
    description: "تُكتب الأرقام بالأرقام الغربية دائمًا في الواجهة الإنجليزية.",
    "arabic-indic": "مشرقية (١٢٣)",
    latin: "غربية (123)",
  },
  tabs: {
    title: "التبويبات",
    description: "اختر التبويبات الظاهرة في الشريط السفلي.",
    homeAlwaysShown: "تظهر الرئيسية دائمًا.",
  },
  about: {
    title: "حول التطبيق",
    sources: "المصادر والشكر",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
    contact: "تواصل معنا",
  },
  sources: {
    title: "المصادر والشكر",
    intro:
      "الرسالي تطبيق مجاني. نشكر الجهات التي أتاحت هذه النصوص والأدوات، ولكلٍّ منها ترخيصه.",
    content: "المحتوى",
    software: "البرمجيات",
    licence: "الترخيص",
    credits,
  },
};
