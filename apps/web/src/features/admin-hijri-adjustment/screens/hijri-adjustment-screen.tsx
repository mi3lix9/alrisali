import {
  adminHijriAdjustmentSchema,
  HIJRI_ADJUSTMENT_LIMIT,
} from "@alrisali/domain/shared";
import type { AdminHijriAdjustment } from "@alrisali/domain/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";
import { Switch } from "@/shared/ui/switch";

import { ForcedDateFieldset } from "../components/forced-date-fields";
import type { ForcedDateFields } from "../components/forced-date-fields";
import {
  forcedDateFromToday,
  forcedDateStatus,
  formatHijriDate,
  todayInHijri,
} from "../utils/hijri-date";

const CHOICES = Array.from(
  { length: HIJRI_ADJUSTMENT_LIMIT * 2 + 1 },
  (_, index) => index - HIJRI_ADJUSTMENT_LIMIT
);

const describeShift = (days: number): string => {
  if (days === 0) {
    return "No adjustment";
  }
  const amount = `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  return days > 0 ? `${amount} ahead` : `${amount} behind`;
};

const STATUS = {
  upcoming: "not started",
  active: "in effect",
  expired: "expired",
} as const;

const describeAdjustment = ({
  offset,
  forced,
}: AdminHijriAdjustment): string =>
  forced
    ? `${describeShift(offset)}; forced date ${STATUS[forcedDateStatus(forced)]}: ${forced.from} is ${formatHijriDate(forced.date)}, until ${forced.until}`
    : describeShift(offset);

/** The Admin's edit: an offset and, while switched on, a forced date. */
interface Draft {
  offset: number;
  forced: ForcedDateFields | null;
}

export const HijriAdjustmentScreen = () => {
  const queryClient = useQueryClient();
  const current = useQuery(orpc.hijriAdjustment.get.queryOptions());
  const [edited, setEdited] = useState<Draft | null>(null);
  const save = useMutation(
    orpc.hijriAdjustment.set.mutationOptions({
      onSuccess: async (published) => {
        setEdited(null);
        await queryClient.invalidateQueries({
          queryKey: orpc.hijriAdjustment.get.queryKey(),
        });
        toast.success(
          `Published: ${describeAdjustment(published)}. Devices update on their next sync.`
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
        Could not load the Hijri Adjustment: {current.error.message}
      </p>
    );
  }

  const published = current.data;
  const draft: Draft = edited ?? published;
  const checked = adminHijriAdjustmentSchema.safeParse(draft);
  const unchanged = JSON.stringify(draft) === JSON.stringify(published);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Hijri Adjustment</h1>
        <p className="text-muted-foreground">
          Shifts every Believer&apos;s Hijri Date to match the official moon
          sighting. Each Believer can add up to {HIJRI_ADJUSTMENT_LIMIT} days of
          their own on top.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium">Days</legend>
        <div className="flex flex-wrap gap-2">
          {CHOICES.map((days) => (
            <Button
              key={days}
              type="button"
              variant={days === draft.offset ? "default" : "outline"}
              aria-pressed={days === draft.offset}
              onClick={() => setEdited({ ...draft, offset: days })}
            >
              {days > 0 ? `+${days}` : days}
            </Button>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          {describeShift(draft.offset)}
          {draft.forced ? ", once the forced date expires" : ""}.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium">Forced date</legend>
        <div className="flex items-center gap-2">
          <Switch
            id="forced-date"
            checked={draft.forced !== null}
            onCheckedChange={(on) =>
              setEdited({
                ...draft,
                forced: on ? forcedDateFromToday(draft.offset) : null,
              })
            }
          />
          <label htmlFor="forced-date" className="text-sm">
            After a moon-sighting announcement: set the Hijri Date of a day. It
            replaces the days above until it expires, then they apply again.
          </label>
        </div>
        {draft.forced ? (
          <ForcedDateFieldset
            value={draft.forced}
            onChange={(forced) => setEdited({ ...draft, forced })}
          />
        ) : null}
      </fieldset>

      {checked.success ? (
        <p className="text-muted-foreground text-sm">
          Today shows as{" "}
          <span className="text-foreground">{todayInHijri(checked.data)}</span>
          {checked.data.forced
            ? ` (forced date ${STATUS[forcedDateStatus(checked.data.forced)]})`
            : ""}
          .
        </p>
      ) : (
        <p className="text-destructive text-sm">
          {checked.error.issues.map((issue) => issue.message).join(". ")}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          disabled={unchanged || !checked.success || save.isPending}
          onClick={() => {
            if (checked.success) {
              save.mutate(checked.data);
            }
          }}
        >
          {save.isPending ? "Publishing..." : "Publish"}
        </Button>
        <span className="text-muted-foreground text-sm">
          Published now: {describeAdjustment(published)}
        </span>
      </div>
    </main>
  );
};
