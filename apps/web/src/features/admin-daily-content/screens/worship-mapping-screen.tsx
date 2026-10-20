import { BOOKS } from "@alrisali/content/books";
import { EVERY_DAY, WEEKDAYS } from "@alrisali/domain/daily-content";
import type { WorshipEntry, WorshipKind } from "@alrisali/domain/daily-content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import Loader from "@/shared/ui/loader";

/** Every Supplication the Books hold, grouped by Book and section. */
const SUPPLICATION_OPTIONS = BOOKS.flatMap((book) =>
  book.sections.map((section) => (
    <optgroup
      key={`${book.id}/${section.id}`}
      label={`${book.title.en} · ${section.title.en}`}
    >
      {section.supplications.map(({ id, number, title }) => (
        <option key={id} value={id}>
          {`${number === undefined ? "" : `${number}. `}${title.en} — ${title.ar}`}
        </option>
      ))}
    </optgroup>
  ))
);

const GROUPS: readonly {
  kind: WorshipKind;
  title: string;
  help: string;
  days: readonly WorshipEntry["day"][];
}[] = [
  {
    kind: "ziyarah",
    title: "Ziyarah of the day",
    help: "Shown on Home on its weekday.",
    days: WEEKDAYS,
  },
  {
    kind: "night-dua",
    title: "Night dua",
    help: "Shown on Home after Maghrib of its weekday (Kumayl on Thursday).",
    days: WEEKDAYS,
  },
  {
    kind: "every-day",
    title: "Every day",
    help: "Shown on Home every day.",
    days: [EVERY_DAY],
  },
];

export const WorshipMappingScreen = () => {
  const queryClient = useQueryClient();
  const current = useQuery(orpc.dailyContent.worshipList.queryOptions());
  const save = useMutation(
    orpc.dailyContent.worshipSet.mutationOptions({
      onSuccess: (map) => {
        queryClient.setQueryData(orpc.dailyContent.worshipList.queryKey(), map);
        toast.success("Published. Devices update on their next sync.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  if (current.isPending) {
    return <Loader />;
  }
  if (current.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load the worship mapping: {current.error.message}
      </p>
    );
  }

  const chosen = (kind: WorshipKind, day: string) =>
    current.data.entries
      .filter((entry) => entry.kind === kind && entry.day === day)
      .map((entry) => entry.supplicationId);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Today&apos;s worship</h1>
        <p className="text-muted-foreground">
          The ziyarah of each weekday, the night dua after Maghrib and the items
          shown every day. The weekday&apos;s dua is set under Daily Content.
          Select several Supplications with Ctrl or Cmd; none clears the day.
        </p>
      </div>

      {GROUPS.map(({ kind, title, help, days }) => (
        <section key={kind} className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="text-muted-foreground text-sm">{help}</p>
          </div>
          <ul className="flex flex-col gap-4">
            {days.map((day) => {
              const selectId = `worship-${kind}-${day}`;
              return (
                <li key={day} className="flex flex-col gap-1 border p-4">
                  <label htmlFor={selectId} className="font-medium capitalize">
                    {day === EVERY_DAY ? "Every day" : day}
                  </label>
                  <select
                    id={selectId}
                    multiple
                    size={4}
                    className="border-input bg-background border px-2 text-sm"
                    value={chosen(kind, day)}
                    disabled={save.isPending}
                    onChange={(event) =>
                      save.mutate({
                        kind,
                        day,
                        supplicationIds: [...event.target.selectedOptions].map(
                          (option) => option.value
                        ),
                      })
                    }
                  >
                    {SUPPLICATION_OPTIONS}
                  </select>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
};
