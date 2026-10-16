import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Contact us",
  description:
    "Have a question, a suggestion or feedback? Send the Al-Risali team a message, signed in or not.",
  fields: {
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
  },
  invalid: {
    name: "Enter a name of {{min}} to {{max}} characters.",
    email: "Enter a valid email address so we can reply.",
    subject: "Enter a subject of {{min}} to {{max}} characters.",
    message: "Write a message of {{min}} to {{max}} characters.",
  },
  send: "Send message",
  sentTitle: "Message sent",
  sentDescription:
    "Thank you. The Al-Risali team reads every message and replies by email.",
  tooMany:
    "You have sent several messages in the last hour. Please try again later.",
  failed: "The message could not be sent. Check your connection and try again.",
};
