import {
  BUILT_IN_OCCASIONS,
  HIJRI_MONTHS,
  MAX_HIJRI_MONTH_LENGTH,
  OCCASION_NAME_MAX_LENGTH,
  OCCASION_TYPES,
  occasionDetailsSchema,
} from "@alrisali/domain/shared";
import type { OccasionDetails } from "@alrisali/domain/shared";
import { useForm } from "@tanstack/react-form";
import type { z } from "zod";

import { HIJRI_MONTH_NAMES } from "@/shared/lib/hijri-months";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { OCCASION_TYPE_LABELS } from "../utils/occasion-labels";

// The Input's look, for the native selects (packages/ui has no select yet).
const SELECT =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full rounded-none border bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:ring-1";

/** The form edits the schema's input: any month number until checked. */
type OccasionFields = z.input<typeof occasionDetailsSchema>;

const EMPTY: OccasionFields = {
  month: 1,
  day: 1,
  type: "celebration",
  name: { ar: "", en: "" },
};

const FieldErrors = ({
  errors,
}: {
  errors: readonly ({ message?: string } | undefined)[];
}) =>
  errors.map((error) => (
    <p key={error?.message} className="text-destructive text-xs">
      {error?.message}
    </p>
  ));

/**
 * Writes an Occasion: its Hijri day and month, type and both names. Checked
 * with the same rules the server applies; it names the built-in Occasions
 * already on the chosen day so Admins do not add one twice.
 */
export const OccasionForm = ({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: OccasionDetails | null;
  submitLabel: string;
  onSubmit: (details: OccasionDetails) => Promise<void>;
  onCancel: () => void;
}) => {
  const form = useForm({
    defaultValues: initial ?? EMPTY,
    validators: { onSubmit: occasionDetailsSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(occasionDetailsSchema.parse(value));
    },
  });

  return (
    <form
      className="flex flex-col gap-4 border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <form.Field name="day">
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name}>Day</Label>
              <Input
                id={field.name}
                type="number"
                min={1}
                max={MAX_HIJRI_MONTH_LENGTH}
                value={Number.isNaN(field.state.value) ? "" : field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(event.target.valueAsNumber)
                }
              />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
        <form.Field name="month">
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name}>Month</Label>
              <select
                id={field.name}
                className={SELECT}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    HIJRI_MONTHS.find(
                      (month) => month === Number(event.target.value)
                    ) ?? field.state.value
                  )
                }
              >
                {HIJRI_MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {`${month}. ${HIJRI_MONTH_NAMES[month]}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form.Field>
        <form.Field name="type">
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name}>Type</Label>
              <select
                id={field.name}
                className={SELECT}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    OCCASION_TYPES.find(
                      (type) => type === event.target.value
                    ) ?? field.state.value
                  )
                }
              >
                {OCCASION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {OCCASION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form.Field>
      </div>

      <form.Subscribe
        selector={({ values }) => ({ month: values.month, day: values.day })}
      >
        {({ month, day }) => {
          const builtIn = BUILT_IN_OCCASIONS.filter(
            (occasion) => occasion.month === month && occasion.day === day
          );
          return builtIn.length === 0 ? null : (
            <p className="text-muted-foreground text-xs">
              Built into the app on this day:{" "}
              {builtIn.map((occasion) => occasion.name.en).join("; ")}
            </p>
          );
        }}
      </form.Subscribe>

      <form.Field name="name.ar">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="occasion-name-ar">Arabic name</Label>
            <Input
              id="occasion-name-ar"
              dir="rtl"
              lang="ar"
              maxLength={OCCASION_NAME_MAX_LENGTH}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldErrors errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>
      <form.Field name="name.en">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="occasion-name-en">English name</Label>
            <Input
              id="occasion-name-en"
              maxLength={OCCASION_NAME_MAX_LENGTH}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldErrors errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
};
