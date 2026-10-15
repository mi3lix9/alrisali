import { HIJRI_MONTHS, MAX_HIJRI_MONTH_LENGTH } from "@alrisali/domain/shared";
import type { HijriMonthDay } from "@alrisali/domain/shared";

import { HIJRI_MONTH_NAMES, wrapsNewYear } from "../utils/hijri-window";
import type { ProgramDraft } from "../utils/program-draft";
import { SelectField } from "./fields";

const MONTH_OPTIONS = HIJRI_MONTHS.map((month) => ({
  value: String(month),
  label: HIJRI_MONTH_NAMES[month],
}));

const DAY_OPTIONS = Array.from(
  { length: MAX_HIJRI_MONTH_LENGTH },
  (_, index) => ({
    value: String(index + 1),
    label: String(index + 1),
  })
);

interface MonthDayFieldsProps {
  label: string;
  value: HijriMonthDay;
  onChange: (value: HijriMonthDay) => void;
}

const MonthDayFields = ({ label, value, onChange }: MonthDayFieldsProps) => (
  <fieldset className="grid grid-cols-2 gap-4">
    <legend className="mb-1.5 text-xs font-medium">{label}</legend>
    <SelectField
      label="Day"
      value={String(value.day)}
      options={DAY_OPTIONS}
      onChange={(day) => onChange({ ...value, day: Number(day) })}
    />
    <SelectField
      label="Month"
      value={String(value.month)}
      options={MONTH_OPTIONS}
      onChange={(chosen) =>
        onChange({
          ...value,
          month:
            HIJRI_MONTHS.find((month) => String(month) === chosen) ??
            value.month,
        })
      }
    />
  </fieldset>
);

interface WindowFieldsProps {
  value: ProgramDraft["window"];
  onChange: (value: ProgramDraft["window"]) => void;
}

/** A Seasonal Program's Hijri window, the same every year. */
export const WindowFields = ({ value, onChange }: WindowFieldsProps) => (
  <div className="flex flex-col gap-3">
    <div className="grid grid-cols-2 gap-6">
      <MonthDayFields
        label="Starts"
        value={value.start}
        onChange={(start) => onChange({ ...value, start })}
      />
      <MonthDayFields
        label="Ends"
        value={value.end}
        onChange={(end) => onChange({ ...value, end })}
      />
    </div>
    <p className="text-muted-foreground text-xs">
      {wrapsNewYear(value)
        ? "Ends before it starts, so it runs across the new Hijri year."
        : "Both days are included. A window that ends before it starts runs across the new Hijri year."}
    </p>
  </div>
);
