import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  tasbihAlZahra: "Tasbih al-Zahra",
  dhikr: {
    "allahu-akbar": "Allahu Akbar",
    alhamdulillah: "Alhamdulillah",
    subhanallah: "Subhanallah",
  },
  counter: {
    label: "Tasbih counter",
    hint: "Tap to count",
    progress: "{{count}} of {{target}}",
    step: "Step {{step}} of {{steps}}",
  },
  roundCompleted: "Round complete. Dhikr Session saved.",
  reset: {
    action: "Start over",
    title: "Start Tasbih al-Zahra over?",
    message: "The current count will be cleared.",
    confirm: "Start over",
    cancel: "Cancel",
  },
  picker: {
    label: "Tasbih",
    new: "New Tasbih",
  },
  open: {
    notFound: "This Tasbih no longer exists.",
    target: "Target: {{target}}",
    noTarget: "No target",
    targetReached: "Target reached!",
    sessionSaved: "Dhikr Session saved. Counting starts again.",
    sessionFailed:
      "Couldn't save the Dhikr Session. Your count is back; try again.",
    saveSession: "Save session",
    edit: "Edit",
    reset: {
      title: "Start “{{name}}” over?",
      message: "The current count will be cleared without being saved.",
    },
  },
  form: {
    createTitle: "New Tasbih",
    editTitle: "Edit Tasbih",
    name: "Name",
    namePlaceholder: "e.g. Salawat",
    target: "Target",
    targetDescription: "Optional. A notice and haptic when you reach it.",
    notes: "Notes",
    notesDescription: "Optional",
    invalidName: "Enter a name.",
    invalidTarget: "Enter a whole number above zero, or leave it blank.",
    create: "Create",
    save: "Save",
    failed: "Couldn't save. Try again.",
    delete: {
      action: "Delete Tasbih",
      title: "Delete “{{name}}”?",
      message: "The Tasbih is deleted; its saved Dhikr Sessions stay.",
      confirm: "Delete",
    },
  },
  export: {
    action: "Export",
    title: "Export Dhikr Sessions",
    message: "Choose a file format.",
    csv: "CSV",
    json: "JSON",
    emptyTitle: "No Dhikr Sessions yet",
    empty: "Complete a round or save a session, then export.",
    failedTitle: "Couldn't export",
    failed: "Try again.",
    ok: "OK",
  },
};
