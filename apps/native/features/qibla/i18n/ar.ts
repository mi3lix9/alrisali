export const ar = {
  title: "القبلة",
  bearing: "{{degrees}}° {{direction}}",
  bearingLabel: "اتجاه القبلة {{degrees}} درجة {{direction}} من الشمال",
  bearingTargetLabel:
    "اتجاه {{target}} {{degrees}} درجة {{direction}} من الشمال",
  distance: "{{distance}} كم إلى {{target}}",
  targets: {
    label: "الوجهة",
    kaaba: "الكعبة",
    najaf: "النجف",
    karbala: "كربلاء",
    mashhad: "مشهد",
    madina: "المدينة",
    kadhimiya: "الكاظمية",
    samarra: "سامراء",
  },
  notQibla: "هذا اتجاه {{target}} وليس القبلة. اختر الكعبة لترجع إلى القبلة.",
  directions: {
    n: "شمال",
    ne: "شمال شرق",
    e: "شرق",
    se: "جنوب شرق",
    s: "جنوب",
    sw: "جنوب غرب",
    w: "غرب",
    nw: "شمال غرب",
  },
  north: "ش",
  facing: "أنت متّجه نحو القبلة",
  facingTarget: "أنت متّجه نحو {{target}}",
  turnRight: "استدر يمينًا {{degrees}}°",
  turnLeft: "استدر يسارًا {{degrees}}°",
  nearRight: "قريب · قليلًا يمينًا",
  nearLeft: "قريب · قليلًا يسارًا",
  declination: "الانحراف المغناطيسي هنا {{degrees}}° {{direction}} · مُطبَّق",
  declinationLabel:
    "صُحِّحت البوصلة إلى الشمال الحقيقي بانحراف مغناطيسي {{degrees}} درجة {{direction}}",
  declinationEast: "شرقًا",
  declinationWest: "غربًا",
  level: {
    label: "ميزان الاستواء",
    level: "الهاتف مستوٍ",
    tilted: "أمسك الهاتف أفقيًا لقراءة أدق",
    tilt: "الميل {{degrees}}°",
  },
  noLocation: {
    title: "حدّد موقعك",
    description: "يُحسب اتجاه القبلة من موقعك. حدّده في تبويب الصلاة.",
    action: "تحديد الموقع",
  },
  compass: {
    checking: "جارٍ تشغيل البوصلة…",
    waiting: "في انتظار البوصلة…",
    permissionTitle: "البوصلة تحتاج إذن الموقع",
    permissionDescription:
      "تقرأ البوصلة اتجاه الجهاز عبر خدمات الموقع، فتحتاج إذن الموقع لتشير إلى القبلة.",
    allow: "السماح بالوصول إلى الموقع",
    blockedDescription:
      "الوصول إلى الموقع غير مسموح. اسمح به من إعدادات الجهاز لتعمل البوصلة.",
    openSettings: "فتح الإعدادات",
    unavailableTitle: "البوصلة غير متاحة",
    unavailableDescription:
      "لا يقدّم هذا الجهاز اتجاه البوصلة. استخدم اتجاه القبلة بالدرجات من الشمال.",
    calibrateTitle: "البوصلة غير دقيقة",
    calibrateDescription:
      "حرّك هاتفك في الهواء على شكل الرقم {{figure}} لمعايرة البوصلة، وابتعد عن المعادن والأجهزة الكهربائية.",
  },
};
