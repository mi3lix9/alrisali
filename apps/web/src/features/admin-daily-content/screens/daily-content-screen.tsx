import { BOOKS, getSupplication } from "@alrisali/content/books";
import type { Weekday } from "@alrisali/domain/daily-content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import Loader from "@/shared/ui/loader";

const NOTHING = "";

/**
 * Every Supplication the Books hold, grouped by Book and section: the picker
 * offers nothing else, so Admins never type an id.
 */
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

/** What a weekday features, in words. */
const describe = (supplicationId: string | null): string => {
  if (supplicationId === null) {
    return "No Daily Content";
  }
  const chosen = getSupplication(supplicationId);
  return chosen
    ? `${chosen.title.en} (${chosen.id})`
    : `Unknown Supplication ${supplicationId}: choose another`;
};

export const DailyContentScreen = () => {
  const queryClient = useQueryClient();
  const current = useQuery(orpc.dailyContent.list.queryOptions());
  const save = useMutation(
    orpc.dailyContent.set.mutationOptions({
      onSuccess: (map, { weekday, supplicationId }) => {
        queryClient.setQueryData(orpc.dailyContent.list.queryKey(), map);
        const title =
          supplicationId === null
            ? "nothing"
            : (getSupplication(supplicationId)?.title.en ?? supplicationId);
        toast.success(
          `Published: ${weekday} features ${title}. Devices update on their next sync.`
        );
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
        Could not load the Daily Content: {current.error.message}
      </p>
    );
  }

  const choose = (weekday: Weekday, value: string) =>
    save.mutate({
      weekday,
      supplicationId: value === NOTHING ? null : value,
    });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Daily Content</h1>
        <p className="text-muted-foreground">
          The Supplication Home features on each weekday. A weekday set to
          nothing shows no Daily Content.
        </p>
      </div>

      <ul className="flex flex-col gap-4">
        {current.data.days.map(({ weekday, supplicationId }) => {
          const selectId = `daily-content-${weekday}`;
          return (
            <li key={weekday} className="flex flex-col gap-1 border p-4">
              <label htmlFor={selectId} className="font-medium capitalize">
                {weekday}
              </label>
              <select
                id={selectId}
                className="border-input bg-background h-9 border px-2 text-sm"
                value={supplicationId ?? NOTHING}
                disabled={save.isPending}
                onChange={(event) => choose(weekday, event.target.value)}
              >
                <option value={NOTHING}>Nothing</option>
                {SUPPLICATION_OPTIONS}
              </select>
              <p className="text-muted-foreground text-sm">
                {describe(supplicationId)}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
};
