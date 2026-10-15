import { HIJRI_ADJUSTMENT_LIMIT } from "@alrisali/domain/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";

import { todayInHijri } from "../utils/hijri-date";

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

export const HijriAdjustmentScreen = () => {
  const queryClient = useQueryClient();
  const current = useQuery(orpc.hijriAdjustment.get.queryOptions());
  const [chosen, setChosen] = useState<number | null>(null);
  const save = useMutation(
    orpc.hijriAdjustment.set.mutationOptions({
      onSuccess: async ({ adjustment }) => {
        setChosen(null);
        await queryClient.invalidateQueries({
          queryKey: orpc.hijriAdjustment.get.queryKey(),
        });
        toast.success(
          `Published: ${describeShift(adjustment)}. Devices update on their next sync.`
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

  const published = current.data.adjustment;
  const selected = chosen ?? published;

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
              variant={days === selected ? "default" : "outline"}
              aria-pressed={days === selected}
              onClick={() => setChosen(days)}
            >
              {days > 0 ? `+${days}` : days}
            </Button>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          {describeShift(selected)}: today shows as{" "}
          <span className="text-foreground">{todayInHijri(selected)}</span>.
        </p>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button
          disabled={selected === published || save.isPending}
          onClick={() => save.mutate({ adjustment: selected })}
        >
          {save.isPending ? "Publishing..." : "Publish"}
        </Button>
        <span className="text-muted-foreground text-sm">
          Published now: {describeShift(published)}
        </span>
      </div>
    </main>
  );
};
