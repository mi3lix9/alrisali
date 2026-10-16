import { HIJRI_MONTHS, MAX_HIJRI_MONTH_LENGTH } from "@alrisali/domain/shared";
import type { forcedHijriDateSchema } from "@alrisali/domain/shared";
import type { z } from "zod";

import { HIJRI_MONTH_NAMES } from "@/shared/lib/hijri-months";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";

/** The fields edit the schema's input: any numbers until checked. */
export type ForcedDateFields = z.input<typeof forcedHijriDateSchema>;

/**
 * A forced Hijri Date: the Gregorian day it starts, the Hijri Date that day
 * is, and the last Gregorian day it applies.
 */
export const ForcedDateFieldset = ({
  value,
  onChange,
}: {
  value: ForcedDateFields;
  onChange: (value: ForcedDateFields) => void;
}) => {
  const setDate = (date: Partial<ForcedDateFields["date"]>) =>
    onChange({ ...value, date: { ...value.date, ...date } });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forced-from">Starting on</Label>
        <Input
          id="forced-from"
          type="date"
          value={value.from}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forced-until">Until (the last day it applies)</Label>
        <Input
          id="forced-until"
          type="date"
          value={value.until}
          onChange={(event) =>
            onChange({ ...value, until: event.target.value })
          }
        />
      </div>
      <fieldset className="flex flex-col gap-1.5 sm:col-span-2">
        <legend className="mb-1.5 text-sm font-medium">
          That first day is
        </legend>
        <div className="grid grid-cols-3 gap-2">
          <Input
            aria-label="Hijri day"
            type="number"
            min={1}
            max={MAX_HIJRI_MONTH_LENGTH}
            value={value.date.day}
            onChange={(event) => setDate({ day: event.target.valueAsNumber })}
          />
          <NativeSelect
            aria-label="Hijri month"
            className="w-full"
            value={String(value.date.month)}
            onChange={(event) => setDate({ month: Number(event.target.value) })}
          >
            {HIJRI_MONTHS.map((month) => (
              <NativeSelectOption key={month} value={String(month)}>
                {HIJRI_MONTH_NAMES[month]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Input
            aria-label="Hijri year"
            type="number"
            min={1}
            value={value.date.year}
            onChange={(event) => setDate({ year: event.target.valueAsNumber })}
          />
        </div>
      </fieldset>
    </div>
  );
};
