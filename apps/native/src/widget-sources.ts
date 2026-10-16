import type { Khatmah, KhatmahLog } from "@alrisali/domain/khatmah";
import { khatmahStatus } from "@alrisali/domain/khatmah";
import { appLinkUrl } from "@alrisali/domain/links";
import { findAyah, verseOfTheDay } from "@alrisali/domain/quran";
import type { WidgetLinks, WidgetSources } from "@alrisali/domain/widgets";

/** Where a tap on each widget goes. */
export const WIDGET_LINKS: WidgetLinks = {
  nextSalah: appLinkUrl({ kind: "next-salah" }),
  calendar: appLinkUrl({ kind: "calendar" }),
  quran: appLinkUrl({ kind: "quran" }),
  ayah: (key) =>
    appLinkUrl({ kind: "ayah", ayah: key as `${number}:${number}` }),
  khatmah: (id) =>
    appLinkUrl(
      id === undefined ? { kind: "khatmah" } : { kind: "khatmah", id }
    ),
};

/**
 * What the widgets read from the Quran and the Khatmah. The widgets' own
 * feature imports neither (features do not import features), so the root
 * composes them here. `useActiveKhatmah` in the Khatmah feature picks the
 * Khatmah the same way: the newest one not yet finished.
 */
export const widgetSources = ({
  khatmahs,
  logs,
  lastRead,
}: {
  khatmahs: readonly Khatmah[];
  logs: readonly KhatmahLog[];
  /** The Last-Read Ayah as `surah:ayah`. */
  lastRead: string | null;
}): WidgetSources => {
  const lastReadAyah = lastRead ? findAyah(lastRead) : undefined;
  return {
    verse: (date) => {
      const { key, surah, ayah, text } = verseOfTheDay(date);
      return { key, surah, ayah, text };
    },
    lastRead: lastReadAyah
      ? {
          surah: lastReadAyah.surah,
          ayah: lastReadAyah.ayah,
          page: lastReadAyah.page,
        }
      : null,
    khatmah: (date) => {
      const reading = khatmahs
        .toReversed()
        .find(
          (khatmah) => khatmahStatus(khatmah, logs, date).state !== "finished"
        );
      if (!reading) {
        return null;
      }
      const status = khatmahStatus(reading, logs, date);
      return {
        id: reading.id,
        state: status.state,
        done: status.done,
        total: status.total,
        pagesRead: status.pagesRead,
        completedToday: status.completedToday,
        sessions: status.sessions,
        current: status.current && {
          number: status.current.number,
          from: status.current.from,
          to: status.current.to,
          pages: status.current.pages,
        },
      };
    },
  };
};
