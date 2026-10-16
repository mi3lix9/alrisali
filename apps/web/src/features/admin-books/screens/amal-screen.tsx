import { BOOKS, getSupplication } from "@alrisali/content/books";
import { AMAL_KIND_NAMES, AMAL_LAST_DAY } from "@alrisali/domain/books";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import Loader from "@/shared/ui/loader";

type Kind = (typeof AMAL_KIND_NAMES)[number];
type Time = "night" | "day";
interface Act {
  kind: Kind;
  time?: Time;
  supplicationId: string;
}

const MONTH_NAMES = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Ula",
  "Jumada al-Thani",
  "Rajab",
  "Shaban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qadah",
  "Dhu al-Hijja",
] as const;

const DAYS = Array.from({ length: AMAL_LAST_DAY + 1 }, (_, day) => day);

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

const dayLabel = (day: number): string =>
  day === 0 ? "Every day of the month" : `Day ${day}`;

const timeLabel = (time: Time | undefined): string => {
  if (time === "night") {
    return "the night before";
  }
  return time === "day" ? "by day" : "any time";
};

export const AmalScreen = () => {
  const queryClient = useQueryClient();
  const current = useQuery(orpc.books.amalList.queryOptions());
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [kind, setKind] = useState<Kind>("dua");
  const [time, setTime] = useState<Time | "">("");
  const [supplicationId, setSupplicationId] = useState("");
  const save = useMutation(
    orpc.books.amalSet.mutationOptions({
      onSuccess: (map) => {
        queryClient.setQueryData(orpc.books.amalList.queryKey(), map);
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
        Could not load the A&apos;mal: {current.error.message}
      </p>
    );
  }

  const actsOf = (ofDay: number): Act[] =>
    current.data.entries
      .filter((entry) => entry.month === month && entry.day === ofDay)
      .map(({ kind: entryKind, time: entryTime, supplicationId: id }) => ({
        kind: entryKind,
        ...(entryTime ? { time: entryTime } : {}),
        supplicationId: id,
      }));
  const daysWithActs = DAYS.filter((ofDay) => actsOf(ofDay).length > 0);

  const remove = (ofDay: number, index: number) =>
    save.mutate({
      month,
      day: ofDay,
      acts: actsOf(ofDay).filter((_, position) => position !== index),
    });

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (supplicationId === "") {
      toast.error("Choose a Supplication.");
      return;
    }
    save.mutate({
      month,
      day,
      acts: [
        ...actsOf(day),
        { kind, ...(time ? { time } : {}), supplicationId },
      ],
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">A&apos;mal</h1>
        <p className="text-muted-foreground">
          The duas, ziyarat, prayers, fasts and tasbih each Hijri day or month
          lists in the Books tab. Day 0 is every day of the month. Devices
          update on their next sync.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-medium">Month</span>
        <select
          className="border-input bg-background border px-2 py-1 text-sm"
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
        >
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={index + 1}>
              {`${index + 1}. ${name}`}
            </option>
          ))}
        </select>
      </label>

      {daysWithActs.length === 0 ? (
        <p className="text-muted-foreground">Nothing listed for this month.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {daysWithActs.map((ofDay) => (
            <li key={ofDay} className="flex flex-col gap-2 border p-4">
              <h2 className="font-medium">{dayLabel(ofDay)}</h2>
              <ul className="flex flex-col gap-1 text-sm">
                {actsOf(ofDay).map((act, index) => (
                  <li
                    key={`${act.time ?? ""}/${act.supplicationId}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>
                      {`${act.kind} · ${timeLabel(act.time)} · ${
                        getSupplication(act.supplicationId)?.title.en ??
                        act.supplicationId
                      }`}
                    </span>
                    <button
                      type="button"
                      className="text-destructive underline"
                      disabled={save.isPending}
                      onClick={() => remove(ofDay, index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex flex-col gap-3 border p-4">
        <h2 className="text-lg font-medium">Add to {MONTH_NAMES[month - 1]}</h2>
        <label className="flex flex-col gap-1 text-sm">
          Day
          <select
            className="border-input bg-background border px-2 py-1"
            value={day}
            onChange={(event) => setDay(Number(event.target.value))}
          >
            {DAYS.map((ofDay) => (
              <option key={ofDay} value={ofDay}>
                {ofDay === 0 ? "0 — every day of the month" : ofDay}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Kind
          <select
            className="border-input bg-background border px-2 py-1"
            value={kind}
            onChange={(event) => setKind(event.target.value as Kind)}
          >
            {AMAL_KIND_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          When
          <select
            className="border-input bg-background border px-2 py-1"
            value={time}
            onChange={(event) => setTime(event.target.value as Time | "")}
          >
            <option value="">Any time</option>
            <option value="night">The night before (its eve)</option>
            <option value="day">By day</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Supplication
          <select
            className="border-input bg-background border px-2 py-1"
            value={supplicationId}
            onChange={(event) => setSupplicationId(event.target.value)}
          >
            <option value="">Choose…</option>
            {SUPPLICATION_OPTIONS}
          </select>
        </label>
        <button
          type="submit"
          className="bg-primary text-primary-foreground self-start px-4 py-2 text-sm"
          disabled={save.isPending}
        >
          Add
        </button>
      </form>
    </main>
  );
};
