import type { AyahKey } from "@alrisali/content/quran";
import { markDoneTill, reschedule } from "@alrisali/domain/khatmah";
import type {
  Khatmah,
  KhatmahLog,
  RescheduleMode,
} from "@alrisali/domain/khatmah";
import { useMutation } from "@tanstack/react-query";
import type { Temporal } from "temporal-polyfill";

import { events } from "@/shared/lib/events";

import {
  announceCompletion,
  invalidateKhatmah,
  khatmahRepository,
} from "./khatmah";

interface MarkDoneTillRequest {
  khatmah: Khatmah;
  logs: readonly KhatmahLog[];
  till: AyahKey;
  today: Temporal.PlainDate;
}

/**
 * Marks everything up to `till` as read: sessions it covers are completed
 * (each emitting `KhatmahSessionCompleted`), the one it ends inside keeps
 * what was read. Resolves false when `till` adds nothing.
 */
export const useMarkKhatmahDoneTill = () =>
  useMutation({
    mutationFn: async ({
      khatmah,
      logs,
      till,
      today,
    }: MarkDoneTillRequest): Promise<KhatmahLog[] | null> => {
      const marked = markDoneTill(khatmah, logs, till, today);
      if (!marked) {
        return null;
      }
      const repository = await khatmahRepository();
      await repository.setAdjustments(khatmah.id, marked.adjust);
      await Promise.all(
        marked.logs.map((log) => repository.log(log, new Date()))
      );
      return marked.logs;
    },
    onSuccess: (completed, { khatmah }) => {
      for (const log of completed ?? []) {
        events.emit("KhatmahSessionCompleted", {
          khatmahId: log.khatmahId,
          session: log.session,
          date: log.date.toString(),
          completedAt: Date.now(),
        });
      }
      if (completed && completed.length > 0) {
        void announceCompletion(khatmah.id);
      }
    },
    onSettled: invalidateKhatmah,
  });

interface RescheduleRequest {
  khatmah: Khatmah;
  logs: readonly KhatmahLog[];
  mode: RescheduleMode;
  today: Temporal.PlainDate;
}

/** Reschedules the sessions not yet done; rejects when there is no new schedule. */
export const useRescheduleKhatmah = () =>
  useMutation({
    mutationFn: async ({
      khatmah,
      logs,
      mode,
      today,
    }: RescheduleRequest): Promise<void> => {
      const next = reschedule(khatmah, logs, mode, today);
      if (!next) {
        throw new Error("There is nothing to reschedule");
      }
      const repository = await khatmahRepository();
      await repository.unlogFrom(khatmah.id, next.fromSession);
      await repository.setAdjustments(khatmah.id, next.adjust);
    },
    onSettled: invalidateKhatmah,
  });
