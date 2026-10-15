import type { SiteCopy } from "./copy";

export const en: SiteCopy = {
  appName: "Al-Risali",
  nav: {
    home: "Home",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    otherLanguage: "العربية",
  },
  home: {
    metaTitle: "Al-Risali — your Shia spiritual companion",
    metaDescription:
      "Prayer times and tracking, the Quran, supplications, dhikr and daily acts of worship in one app for iPhone and Android.",
    tagline: "Your Shia spiritual companion",
    title: "Prayer, Quran, supplications and dhikr in one place",
    description:
      "Al-Risali brings together prayer times and tracking, the Holy Quran, the supplications of Ahl al-Bayt, the tasbih and your daily acts of worship. It works offline, and everything you record stays yours.",
    downloadHeading: "Download the app",
    appStore: { label: "App Store", caption: "Download on the" },
    playStore: { label: "Google Play", caption: "Get it on" },
    featuresHeading: "What's inside",
    features: [
      {
        title: "Prayer Times and reminders",
        description:
          "Accurate times for your location with the Calculation Method you follow, and reminders scheduled on your device.",
      },
      {
        title: "Prayer tracking",
        description:
          "Log each Salah, keep your Prayer Streak and reflect on your khushu.",
      },
      {
        title: "The Holy Quran",
        description:
          "The Madinah mushaf page by page or surah by surah, resuming where you stopped.",
      },
      {
        title: "Supplications and books",
        description:
          "Mafatih al-Jinan, al-Sahifa al-Sajjadiyya and more, with Recite-Along.",
      },
      {
        title: "Tasbih and dhikr",
        description:
          "Tasbih al-Zahra and an open tasbih that remember every session.",
      },
      {
        title: "Programs and occasions",
        description:
          "Programs of daily acts, the Hijri calendar of occasions, and gatherings near you.",
      },
    ],
    verse: {
      text: "وَاعْبُدْ رَبَّكَ حَتَّىٰ يَأْتِيَكَ الْيَقِينُ",
      translation: "And worship your Lord until certainty comes to you.",
      reference: "Al-Hijr 15:99",
    },
  },
  privacy: {
    title: "Privacy Policy",
    description: "How Al-Risali collects, uses and protects your information.",
    lastUpdated: "Last updated: October 2026",
    sections: [
      {
        heading: "Introduction",
        paragraphs: [
          "Al-Risali is committed to protecting your privacy. This policy explains what we collect, why, and the choices you have, in line with the Saudi Personal Data Protection Law (PDPL) and international best practice.",
        ],
      },
      {
        heading: "Using the app as a guest",
        paragraphs: [
          "You can use every feature without an account. As a guest, everything you record — prayer logs, habits, tasbih sessions, mood check-ins, favorites and reading progress — is kept only in a database on your device.",
        ],
      },
      {
        heading: "Signing in",
        paragraphs: [
          "When you sign in with Apple or Google, we receive your name and email address to create and identify your account. Your records then sync to a cloud database that belongs to you alone, so they are available on your other devices. Our server creates that database and grants your devices access to it, but never reads or changes your records.",
        ],
      },
      {
        heading: "Your location",
        paragraphs: [
          "Your location is used on your device to calculate prayer times and the Qibla direction. Our server never stores your location. If you search for a city, only the search text is sent to a place-search service.",
        ],
      },
      {
        heading: "Camera and microphone",
        paragraphs: [
          "The Prayer Assistant can use the camera and microphone to follow your positions and recitation. They are used only while the Prayer Assistant is open, everything is processed on your device, and no image, video or audio is recorded or uploaded. You can use the app fully without granting these permissions.",
        ],
      },
      {
        heading: "Notifications",
        paragraphs: [
          "Prayer and habit reminders are scheduled on your device. If you allow notifications, we store a push token for your device so we can deliver announcements from the Al-Risali team. The token contains no personal content, and we delete it when it stops working or when you delete your account.",
        ],
      },
      {
        heading: "Contact messages",
        paragraphs: [
          "When you write to us, we keep your name, email address and message so we can reply. To prevent abuse we store a one-way hash of your IP address, never the address itself.",
        ],
      },
      {
        heading: "Usage analytics and error reports",
        paragraphs: [
          "The app sends us usage events — which screens and features are used — with an anonymous device identifier, your account identifier if you are signed in, and basic device information. We use them only to improve the app and never share them with advertising or analytics companies. Crash and error reports are sent to Sentry so we can fix problems.",
        ],
      },
      {
        heading: "How we use your information",
        paragraphs: [],
        items: [
          "To sync your records across your devices",
          "To deliver announcements you have allowed",
          "To reply to your messages",
          "To find and fix problems and improve the app",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "Under the Personal Data Protection Law you have the right to:",
        ],
        items: [
          "Access your personal data",
          "Correct inaccurate data",
          "Delete your data",
          "Withdraw your consent at any time",
          "Receive a copy of your data in a portable format",
          "Object to certain processing",
        ],
      },
      {
        heading: "Deleting your account",
        paragraphs: [
          "You can delete your account from the app's settings at any time. Deletion is immediate and permanent: it destroys your cloud database and your account. You can also ask us to delete it through the Contact page.",
        ],
      },
      {
        heading: "Third parties",
        paragraphs: [
          "We use Apple and Google for sign-in, Turso to host databases and Sentry for error reports; each has its own privacy policy. We show no advertising, do not track you across other companies' apps or websites, and never sell your personal data.",
        ],
      },
      {
        heading: "Children",
        paragraphs: [
          "We do not knowingly collect personal information from children under 13 without parental consent. If you believe we have, please contact us and we will delete it.",
        ],
      },
      {
        heading: "Changes to this policy",
        paragraphs: [
          "We may update this policy. We will tell you about significant changes in the app, and the date above shows the latest version.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    description: "The terms that apply when you use Al-Risali.",
    lastUpdated: "Last updated: October 2026",
    sections: [
      {
        heading: "Acceptance of terms",
        paragraphs: [
          "By using Al-Risali you agree to these Terms of Service. If you do not agree, please do not use the app.",
        ],
      },
      {
        heading: "The service",
        paragraphs: [
          "Al-Risali is a Shia spiritual companion offering prayer times and tracking, the Quran, supplications, dhikr and daily acts of worship. It is provided for personal, non-commercial use.",
        ],
      },
      {
        heading: "Accounts",
        paragraphs: [],
        items: [
          "You may use the app as a guest or sign in with Apple or Google",
          "You are responsible for the security of your account",
          "You may not share or transfer your account",
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: ["You may not:"],
        items: [
          "Use the app in a way that breaks applicable law",
          "Interfere with or disrupt the service",
          "Access the service by automated means",
          "Impersonate others or misrepresent your affiliation",
          "Send harmful content or malware",
        ],
      },
      {
        heading: "Religious content",
        paragraphs: [
          "We take care that the texts in the app are accurate and cite their sources. The app is a spiritual aid and does not replace a qualified scholar for religious rulings. Prayer times are calculated with standard methods and may differ from your local mosque.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "The app's design and original content are protected by intellectual property law. Texts from other sources are used under their own terms, listed in the app's Sources & Credits. You may not copy, modify or distribute the app's proprietary parts.",
        ],
      },
      {
        heading: "Availability",
        paragraphs: [
          "We aim for uninterrupted service but cannot guarantee it. We may change or discontinue features.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "The app is provided “as is” without warranties of any kind. We are not liable for indirect, incidental or consequential damages arising from its use.",
        ],
      },
      {
        heading: "Termination",
        paragraphs: [
          "We may suspend access for violations of these terms. You may delete your account at any time from the app's settings.",
        ],
      },
      {
        heading: "Governing law",
        paragraphs: [
          "These terms are governed by the laws of the Kingdom of Saudi Arabia, and disputes are settled by its competent courts.",
        ],
      },
      {
        heading: "Changes to these terms",
        paragraphs: [
          "We may update these terms. Continuing to use the app after a change means you accept it, and we will tell you about significant changes in the app.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact us",
    description:
      "Have a question, a suggestion or feedback? Send the Al-Risali team a message — no account needed.",
  },
};
