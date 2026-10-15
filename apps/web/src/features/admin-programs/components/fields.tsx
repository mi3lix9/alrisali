import type { BilingualText } from "@alrisali/domain/programs";
import { useId } from "react";
import type { ReactNode } from "react";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import type { FieldErrors } from "../utils/program-draft";

const CONTROL =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 w-full min-w-0 rounded-none border bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:ring-1 aria-invalid:ring-1";

interface FieldProps {
  label: string;
  error?: string | undefined;
  children: (control: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => ReactNode;
}

const Field = ({ label, error, children }: FieldProps) => {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-invalid": error !== undefined,
        "aria-describedby": error === undefined ? undefined : errorId,
      })}
      {error === undefined ? null : (
        <p id={errorId} className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
};

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  dir?: "rtl" | "ltr";
  multiline?: boolean;
  type?: "text" | "url" | "date";
}

export const TextField = ({
  label,
  value,
  onChange,
  error,
  dir,
  multiline = false,
  type = "text",
}: TextFieldProps) => (
  <Field label={label} error={error}>
    {(control) =>
      multiline ? (
        <textarea
          {...control}
          dir={dir}
          rows={3}
          className={`${CONTROL} min-h-16 py-1.5`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          {...control}
          dir={dir}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    }
  </Field>
);

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string | undefined;
  min: number;
  max: number;
}

export const NumberField = ({
  label,
  value,
  onChange,
  error,
  min,
  max,
}: NumberFieldProps) => (
  <Field label={label} error={error}>
    {(control) => (
      <Input
        {...control}
        type="number"
        min={min}
        max={max}
        value={Number.isNaN(value) ? "" : value}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
    )}
  </Field>
);

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  error?: string | undefined;
}

export const SelectField = <T extends string>({
  label,
  value,
  options,
  onChange,
  error,
}: SelectFieldProps<T>) => (
  <Field label={label} error={error}>
    {(control) => (
      <select
        {...control}
        className={`${CONTROL} h-8`}
        value={value}
        onChange={(event) => {
          const chosen = options.find(
            (option) => option.value === event.target.value
          );
          if (chosen) {
            onChange(chosen.value);
          }
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )}
  </Field>
);

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const CheckboxField = ({
  label,
  checked,
  onChange,
}: CheckboxFieldProps) => (
  <label className="flex items-center gap-2 text-xs">
    <input
      type="checkbox"
      className="accent-primary size-4"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    {label}
  </label>
);

interface BilingualFieldsProps {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  /** Errors keyed `ar` and `en`. */
  errors: FieldErrors;
  multiline?: boolean;
}

/** One text in Arabic and English, side by side. */
export const BilingualFields = ({
  label,
  value,
  onChange,
  errors,
  multiline = false,
}: BilingualFieldsProps) => (
  <div className="grid grid-cols-2 gap-4">
    <TextField
      label={`${label} (English)`}
      value={value.en}
      error={errors.en}
      multiline={multiline}
      onChange={(en) => onChange({ ...value, en })}
    />
    <TextField
      label={`${label} (Arabic)`}
      dir="rtl"
      value={value.ar}
      error={errors.ar}
      multiline={multiline}
      onChange={(ar) => onChange({ ...value, ar })}
    />
  </div>
);
