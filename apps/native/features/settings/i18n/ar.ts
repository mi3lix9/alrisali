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
    "صوت الأذان في تنبيهات الصلاة: مطلع أذان شيعي بصوت سعيد حاتم‌زاده ورمزيار من ويكيميديا كومنز، بترخيص CC BY-SA 4.0، بعد تقصيره وتحويله إلى صيغة WAV.",
  tanzil:
    "بدايات أرباع الأحزاب من بيانات Tanzil الوصفية للقرآن، مصحَّحة على علامات الأرباع في نص مجمع الملك فهد.",
  "panel-ui": "مكوّنات واجهة التطبيق.",
  "open-source":
    "بُني التطبيق على Expo وReact Native ومكتبات مفتوحة المصدر أخرى، لكلٍّ منها ترخيصه. شيفرة الرسالي نفسها مرخّصة بترخيص MIT.",
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
    save: "حفظ الموقع",
  },
  calculationMethod: {
    title: "طريقة الحساب",
    description: "القواعد التي تُحسب بها أوقات الصلاة.",
    jafari: "الجعفري",
    sunni: "السنّي",
    hanafi: "الحنفي",
    ibadi: "الإباضي",
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
    licence: "الترخيص: {{licence}}",
    credits,
  },
};
