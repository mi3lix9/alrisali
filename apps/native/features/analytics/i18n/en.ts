import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  birthYear: {
    title: "Birth year",
    description:
      "Optional. It helps the team understand the age range of the app's users, and is sent only as a number with anonymous usage statistics.",
    label: "Birth year (for example {{example}})",
    invalid: "Enter a four-digit year between {{min}} and this year.",
    save: "Save",
    clear: "Remove",
  },
};
