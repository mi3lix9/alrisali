import {
  ACT_TYPES,
  SALAH_TIMINGS,
  SUNNAH_PRAYER_PRESETS,
} from "@alrisali/domain/programs";
import type { ActType, SalahTiming } from "@alrisali/domain/programs";
import { SALAH } from "@alrisali/domain/shared";
import type { Salah } from "@alrisali/domain/shared";

import type { ActDraft, FieldErrors } from "../utils/program-draft";
import { errorsUnder } from "../utils/program-draft";
import {
  BilingualFields,
  CheckboxField,
  NumberField,
  SelectField,
  TextField,
} from "./fields";

const MAX_RAKAHS = 20;

const TYPE_LABELS = {
  regular: "Regular",
  dua: "Dua",
  prayer: "Prayer",
} as const satisfies Record<ActType, string>;

const SALAH_LABELS = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
} as const satisfies Record<Salah, string>;

const TIMING_LABELS = {
  before: "Before",
  after: "After",
} as const satisfies Record<SalahTiming, string>;

/** ISO weekdays, 1 = Monday … 7 = Sunday. */
const WEEKDAYS = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 7, label: "Sun" },
] as const;

const SCHEDULE_OPTIONS = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "On weekdays" },
  { value: "once", label: "Once, on a date" },
] as const;

const NO_SALAH = "none";
const OTHER_PRAYER = "other";

const SALAH_OPTIONS: { value: Salah | typeof NO_SALAH; label: string }[] = [
  { value: NO_SALAH, label: "No Salah" },
  ...SALAH.map((salah) => ({ value: salah, label: SALAH_LABELS[salah] })),
];

const PRESET_OPTIONS = [
  ...SUNNAH_PRAYER_PRESETS.map((preset) => ({
    value: preset.key,
    label: preset.name.en,
  })),
  { value: OTHER_PRAYER, label: "Other" },
];

interface ActFormProps {
  act: ActDraft;
  onChange: (act: ActDraft) => void;
  /** Errors under this Act, keyed like `name.ar` or `detail.rakahs`. */
  errors: FieldErrors;
}

const ScheduleFields = ({ act, onChange, errors }: ActFormProps) => (
  <div className="flex flex-col gap-3">
    <SelectField
      label="Schedule"
      value={act.scheduleKind}
      options={SCHEDULE_OPTIONS}
      onChange={(scheduleKind) => onChange({ ...act, scheduleKind })}
    />
    {act.scheduleKind === "weekdays" ? (
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-xs font-medium">Weekdays</legend>
        <div className="flex flex-wrap gap-4">
          {WEEKDAYS.map(({ day, label }) => (
            <CheckboxField
              key={day}
              label={label}
              checked={act.weekdays.includes(day)}
              onChange={(checked) =>
                onChange({
                  ...act,
                  weekdays: checked
                    ? [...act.weekdays, day].toSorted((a, b) => a - b)
                    : act.weekdays.filter((chosen) => chosen !== day),
                })
              }
            />
          ))}
        </div>
        {errors["schedule.weekdays"] === undefined ? null : (
          <p className="text-destructive text-xs">
            Choose at least one weekday.
          </p>
        )}
      </fieldset>
    ) : null}
    {act.scheduleKind === "once" ? (
      <TextField
        label="Date"
        type="date"
        value={act.date}
        error={errors["schedule.date"]}
        onChange={(date) => onChange({ ...act, date })}
      />
    ) : null}
  </div>
);

const SalahFields = ({ act, onChange }: Omit<ActFormProps, "errors">) => {
  const { salah } = act;
  return (
    <div className="grid grid-cols-2 gap-4">
      <SelectField
        label="Salah"
        value={salah ?? NO_SALAH}
        options={SALAH_OPTIONS}
        onChange={(chosen) =>
          onChange({ ...act, salah: chosen === NO_SALAH ? null : chosen })
        }
      />
      {salah === null ? null : (
        <SelectField
          label="Done"
          value={act.timing}
          options={SALAH_TIMINGS.map((timing) => ({
            value: timing,
            label: `${TIMING_LABELS[timing]} ${SALAH_LABELS[salah]}`,
          }))}
          onChange={(timing) => onChange({ ...act, timing })}
        />
      )}
    </div>
  );
};

const DuaFields = ({ act, onChange, errors }: ActFormProps) => {
  const update = (dua: Partial<ActDraft["dua"]>) =>
    onChange({ ...act, dua: { ...act.dua, ...dua } });
  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Arabic text"
        dir="rtl"
        multiline
        value={act.dua.arabic}
        error={errors["detail.arabic"]}
        onChange={(arabic) => update({ arabic })}
      />
      <TextField
        label="Transliteration"
        multiline
        value={act.dua.transliteration}
        error={errors["detail.transliteration"]}
        onChange={(transliteration) => update({ transliteration })}
      />
      <TextField
        label="Translation (English)"
        multiline
        value={act.dua.translation}
        error={errors["detail.translation"]}
        onChange={(translation) => update({ translation })}
      />
      <BilingualFields
        label="Instructions"
        multiline
        value={act.dua.instructions}
        errors={errorsUnder(errors, "detail.instructions")}
        onChange={(instructions) => update({ instructions })}
      />
      <TextField
        label="Audio URL (optional)"
        type="url"
        value={act.dua.audioUrl}
        error={
          errors["detail.audioUrl"] === undefined
            ? undefined
            : "Enter an http or https link, or leave it blank."
        }
        onChange={(audioUrl) => update({ audioUrl })}
      />
    </div>
  );
};

const PrayerFields = ({ act, onChange, errors }: ActFormProps) => {
  const update = (prayer: Partial<ActDraft["prayer"]>) =>
    onChange({ ...act, prayer: { ...act.prayer, ...prayer } });
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Sunnah prayer"
          value={act.prayer.preset ?? OTHER_PRAYER}
          options={PRESET_OPTIONS}
          onChange={(key) => {
            const preset = SUNNAH_PRAYER_PRESETS.find(
              (candidate) => candidate.key === key
            );
            if (!preset) {
              update({ preset: null });
              return;
            }
            onChange({
              ...act,
              name: preset.name,
              salah: preset.salah?.salah ?? null,
              timing: preset.salah?.timing ?? act.timing,
              prayer: {
                ...act.prayer,
                preset: preset.key,
                rakahs: preset.rakahs,
              },
            });
          }}
        />
        <NumberField
          label="Rakahs"
          min={1}
          max={MAX_RAKAHS}
          value={act.prayer.rakahs}
          error={errors["detail.rakahs"]}
          onChange={(rakahs) => update({ rakahs })}
        />
      </div>
      <BilingualFields
        label="Steps"
        multiline
        value={act.prayer.steps}
        errors={errorsUnder(errors, "detail.steps")}
        onChange={(steps) => update({ steps })}
      />
      <BilingualFields
        label="Adhkar"
        multiline
        value={act.prayer.adhkar}
        errors={errorsUnder(errors, "detail.adhkar")}
        onChange={(adhkar) => update({ adhkar })}
      />
      <CheckboxField
        label="Requires wudu"
        checked={act.prayer.requiresWudu}
        onChange={(requiresWudu) => update({ requiresWudu })}
      />
    </div>
  );
};

export const ActForm = ({ act, onChange, errors }: ActFormProps) => (
  <div className="flex flex-col gap-4">
    <BilingualFields
      label="Name"
      value={act.name}
      errors={errorsUnder(errors, "name")}
      onChange={(name) => onChange({ ...act, name })}
    />
    <BilingualFields
      label="Description"
      multiline
      value={act.description}
      errors={errorsUnder(errors, "description")}
      onChange={(description) => onChange({ ...act, description })}
    />
    <ScheduleFields act={act} onChange={onChange} errors={errors} />
    <SalahFields act={act} onChange={onChange} />
    <SelectField
      label="Type"
      value={act.type}
      options={ACT_TYPES.map((type) => ({
        value: type,
        label: TYPE_LABELS[type],
      }))}
      onChange={(type) => onChange({ ...act, type })}
    />
    {act.type === "dua" ? (
      <DuaFields act={act} onChange={onChange} errors={errors} />
    ) : null}
    {act.type === "prayer" ? (
      <PrayerFields act={act} onChange={onChange} errors={errors} />
    ) : null}
  </div>
);
