import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  home: {
    title: "My shortcuts",
    edit: "Edit",
    editLabel: "Edit shortcuts",
    allTools: "All",
  },
  editor: {
    title: "My shortcuts",
    hint: "Drag to reorder. Seasonal tools appear only in their season.",
    season: "{{start}} to {{end}}",
    moveUp: "Move up",
    moveDown: "Move down",
  },
  allTools: {
    title: "All tools",
  },
};
