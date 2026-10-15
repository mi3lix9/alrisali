import { z } from "zod";

/** The five Salah, each with its own Reminder rule. */
export const SALAH = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export type Salah = (typeof SALAH)[number];

export const salahSchema = z.enum(SALAH);

/** Tones a Reminder can play; "default" is the system's own. */
export const REMINDER_SOUNDS = ["default", "chime", "bell"] as const;

export type ReminderSound = (typeof REMINDER_SOUNDS)[number];

export const MAX_MINUTES_BEFORE = 60;

/**
 * How one Prayer Time reminds. `enabled: false` (disable) wins over `muted`,
 * which wins over `voice`, which wins over `sound`.
 */
export interface ReminderRule {
  enabled: boolean;
  /** Minutes before the Prayer Time the Reminder fires. */
  minutesBefore: number;
  sound: ReminderSound;
  /** Shown without any sound. */
  muted: boolean;
  /** Plays the recorded Adhan voice instead of the tone. */
  voice: boolean;
}

/** What the Reminder sounds like, after the rule's precedence. */
export type ReminderAlert =
  | { kind: "sound"; sound: ReminderSound }
  | { kind: "voice" }
  | { kind: "silent" };

/** The alert a rule makes, or null when it is disabled. */
export const reminderAlert = (rule: ReminderRule): ReminderAlert | null => {
  if (!rule.enabled) {
    return null;
  }
  if (rule.muted) {
    return { kind: "silent" };
  }
  if (rule.voice) {
    return { kind: "voice" };
  }
  return { kind: "sound", sound: rule.sound };
};

export const MINUTES_PER_DAY = 1440;

/**
 * Hours in which non-essential Reminders are held back. Times are minutes
 * after local midnight; a start after the end runs across midnight, and equal
 * times quiet nothing.
 */
export interface QuietHours {
  enabled: boolean;
  start: number;
  end: number;
}

export interface ReminderSettings {
  salah: Record<Salah, ReminderRule>;
  imsak: ReminderRule;
  quietHours: QuietHours;
}

export const DEFAULT_MINUTES_BEFORE = 5;

const salahRule = (enabled: boolean): ReminderRule => ({
  enabled,
  minutesBefore: DEFAULT_MINUTES_BEFORE,
  sound: "default",
  muted: false,
  voice: false,
});

/**
 * Asr and Isha start off, like their Prayer Times on the timetable: most
 * Believers pray them joined with Dhuhr and Maghrib. Imsak starts off too;
 * it matters on fasting days.
 */
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  salah: {
    fajr: salahRule(true),
    dhuhr: salahRule(true),
    asr: salahRule(false),
    maghrib: salahRule(true),
    isha: salahRule(false),
  },
  imsak: { ...salahRule(false), minutesBefore: 0 },
  quietHours: { enabled: false, start: 23 * 60, end: 5 * 60 },
};

export const minutesBeforeSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_MINUTES_BEFORE);

const minuteOfDaySchema = z
  .number()
  .int()
  .min(0)
  .max(MINUTES_PER_DAY - 1);

const ruleShape = {
  enabled: z.boolean(),
  minutesBefore: minutesBeforeSchema,
  sound: z.enum(REMINDER_SOUNDS),
  muted: z.boolean(),
  voice: z.boolean(),
};

const quietHoursShape = {
  enabled: z.boolean(),
  start: minuteOfDaySchema,
  end: minuteOfDaySchema,
};

const ruleChangeSchema = z.object(ruleShape).partial();

/** The settings to change; anything left out keeps its value. */
export const reminderSettingsChangeSchema = z.object({
  salah: z.partialRecord(salahSchema, ruleChangeSchema).optional(),
  imsak: ruleChangeSchema.optional(),
  quietHours: z.object(quietHoursShape).partial().optional(),
});

export type ReminderSettingsChange = z.input<
  typeof reminderSettingsChangeSchema
>;

/** A stored JSON object, before its fields are checked one by one. */
const storedObjectSchema = z.record(z.string(), z.unknown());

/**
 * Each field of `fallback` replaced by the stored one where that is valid, so
 * a value written by a newer app (or a broken one) never loses the rest.
 */
const readFields = <T extends object>(
  shape: { [Key in keyof T]: z.ZodType<T[Key]> },
  stored: unknown,
  fallback: T
): T => {
  const result = { ...fallback };
  const object = storedObjectSchema.safeParse(stored);
  if (!object.success) {
    return result;
  }
  for (const key of Object.keys(shape) as (keyof T & string)[]) {
    const parsed = shape[key].safeParse(object.data[key]);
    if (parsed.success) {
      result[key] = parsed.data;
    }
  }
  return result;
};

/** A rule from a stored value of unknown shape. */
export const readReminderRule = (
  stored: unknown,
  fallback: ReminderRule
): ReminderRule => readFields(ruleShape, stored, fallback);

/** Every Salah's rule from a stored map of unknown shape. */
export const readSalahRules = (
  stored: unknown
): Record<Salah, ReminderRule> => {
  const object = storedObjectSchema.safeParse(stored);
  return Object.fromEntries(
    SALAH.map((salah) => [
      salah,
      readReminderRule(
        object.success ? object.data[salah] : undefined,
        DEFAULT_REMINDER_SETTINGS.salah[salah]
      ),
    ])
  ) as Record<Salah, ReminderRule>;
};

/** Quiet hours from a stored value of unknown shape. */
export const readQuietHours = (stored: unknown): QuietHours =>
  readFields(quietHoursShape, stored, DEFAULT_REMINDER_SETTINGS.quietHours);

/** The settings after a validated change. */
export const applyReminderSettingsChange = (
  settings: ReminderSettings,
  change: ReminderSettingsChange
): ReminderSettings => {
  const parsed = reminderSettingsChangeSchema.parse(change);
  // The change is valid; reading it over the current settings keeps every
  // field it leaves out.
  return {
    salah: Object.fromEntries(
      SALAH.map((salah) => [
        salah,
        readReminderRule(parsed.salah?.[salah], settings.salah[salah]),
      ])
    ) as Record<Salah, ReminderRule>,
    imsak: readReminderRule(parsed.imsak, settings.imsak),
    quietHours: readFields(
      quietHoursShape,
      parsed.quietHours,
      settings.quietHours
    ),
  };
};

/** Whether a local minute of the day falls in the quiet hours. */
export const isInQuietHours = (
  quietHours: QuietHours,
  minuteOfDay: number
): boolean => {
  const { enabled, start, end } = quietHours;
  if (!enabled || start === end) {
    return false;
  }
  return start < end
    ? minuteOfDay >= start && minuteOfDay < end
    : minuteOfDay >= start || minuteOfDay < end;
};
