import { CONTACT_MESSAGE_LIMITS } from "@alrisali/domain/contact";
import type { ContactMessageField } from "@alrisali/domain/contact";
import type { Language } from "@alrisali/i18n";

export interface ContactFormCopy {
  fields: Record<ContactMessageField, string>;
  /** Shown under a field that breaks its limits. */
  invalid: Record<ContactMessageField, string>;
  send: string;
  sending: string;
  sentTitle: string;
  sentDescription: string;
  sendAnother: string;
  tooMany: string;
  failed: string;
}

const { name, subject, message } = CONTACT_MESSAGE_LIMITS;

export const contactFormCopy: Record<Language, ContactFormCopy> = {
  ar: {
    fields: {
      name: "الاسم",
      email: "البريد الإلكتروني",
      subject: "الموضوع",
      message: "الرسالة",
    },
    invalid: {
      name: `اكتب اسمًا من ${name.min} إلى ${name.max} حرفًا.`,
      email: "اكتب بريدًا إلكترونيًا صحيحًا لنتمكن من الرد عليك.",
      subject: `اكتب موضوعًا من ${subject.min} إلى ${subject.max} حرفًا.`,
      message: `اكتب رسالة من ${message.min} إلى ${message.max} حرف.`,
    },
    send: "أرسل الرسالة",
    sending: "جارٍ الإرسال…",
    sentTitle: "أُرسلت رسالتك",
    sentDescription:
      "شكرًا لك. يقرأ فريق الرسالي كل رسالة ويردّ عبر البريد الإلكتروني.",
    sendAnother: "أرسل رسالة أخرى",
    tooMany: "أرسلت عدة رسائل خلال الساعة الماضية. حاول مرة أخرى لاحقًا.",
    failed: "تعذّر إرسال الرسالة. حاول مرة أخرى.",
  },
  en: {
    fields: {
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
    },
    invalid: {
      name: `Enter a name of ${name.min} to ${name.max} characters.`,
      email: "Enter a valid email address so we can reply.",
      subject: `Enter a subject of ${subject.min} to ${subject.max} characters.`,
      message: `Write a message of ${message.min} to ${message.max} characters.`,
    },
    send: "Send message",
    sending: "Sending…",
    sentTitle: "Message sent",
    sentDescription:
      "Thank you. The Al-Risali team reads every message and replies by email.",
    sendAnother: "Send another message",
    tooMany:
      "You have sent several messages in the last hour. Please try again later.",
    failed: "The message could not be sent. Please try again.",
  },
};
