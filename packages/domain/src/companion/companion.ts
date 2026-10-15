import { z } from "zod";

import { salahSchema } from "../shared";

/** How the Companion looks as it grows: a Garden or a Traveler. */
export const COMPANION_THEMES = ["traveler", "garden"] as const;

export type CompanionTheme = (typeof COMPANION_THEMES)[number];

export const DEFAULT_COMPANION_THEME: CompanionTheme = "traveler";

export const companionThemeSchema = z.enum(COMPANION_THEMES);

/** XP needed for each level. */
export const XP_PER_LEVEL = 100;

const id = z.string().trim().min(1);
const date = z.iso.date();

/**
 * A devotion the Companion gains XP for. Each carries only what makes it the
 * same event on every device, so the award it earns is keyed by it.
 */
export const xpEventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("salah"), date, salah: salahSchema }),
  z.object({ kind: z.literal("act"), programId: id, actId: id, date }),
  z.object({ kind: z.literal("habit"), habitId: id, date }),
  z.object({ kind: z.literal("dhikr-session"), sessionId: id }),
  z.object({ kind: z.literal("reading"), supplicationId: id, date }),
  z.object({ kind: z.literal("lesson"), lessonId: id }),
]);

export type XpEvent = z.infer<typeof xpEventSchema>;

export type XpEventKind = XpEvent["kind"];

/** XP each kind of devotion earns. */
export const XP_FOR: Record<XpEventKind, number> = {
  salah: 10,
  act: 10,
  habit: 10,
  "dhikr-session": 5,
  reading: 5,
  lesson: 20,
};

/** The parts of an event that identify it, in key order. */
const identity = (event: XpEvent): string[] => {
  switch (event.kind) {
    case "salah": {
      return [event.date, event.salah];
    }
    case "act": {
      return [event.programId, event.actId, event.date];
    }
    case "habit": {
      return [event.habitId, event.date];
    }
    case "dhikr-session": {
      return [event.sessionId];
    }
    case "reading": {
      return [event.supplicationId, event.date];
    }
    case "lesson": {
      return [event.lessonId];
    }
    default: {
      throw new Error("Unknown XP event");
    }
  }
};

export interface XpAward {
  /**
   * Stable across devices and replays (`salah:2026-10-16:fajr`), so storing
   * it as a primary key awards each event once, even after a sync.
   */
  key: string;
  kind: XpEventKind;
  xp: number;
}

/** The award an event earns. Throws when the event is malformed. */
export const xpAward = (event: XpEvent): XpAward => {
  const parsed = xpEventSchema.parse(event);
  // Escaped, so an id holding `:` cannot collide with another event's key.
  const key = [parsed.kind, ...identity(parsed)]
    .map(encodeURIComponent)
    .join(":");
  return { key, kind: parsed.kind, xp: XP_FOR[parsed.kind] };
};

export interface CompanionLevel {
  /** From 1. */
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  /** 0 to 1, through the current level. */
  fraction: number;
}

/** Where total XP leaves the Companion. */
export const companionLevel = (xp: number): CompanionLevel => {
  const total = Math.max(0, Math.floor(xp));
  const xpIntoLevel = total % XP_PER_LEVEL;
  return {
    level: Math.floor(total / XP_PER_LEVEL) + 1,
    xpIntoLevel,
    xpToNextLevel: XP_PER_LEVEL - xpIntoLevel,
    fraction: xpIntoLevel / XP_PER_LEVEL,
  };
};

/** The new level when going from `before` to `after` XP levels up, else null. */
export const levelReached = (before: number, after: number): number | null => {
  const reached = companionLevel(after).level;
  return reached > companionLevel(before).level ? reached : null;
};

export const GARDEN_STAGES = [
  "seedling",
  "sprout",
  "bloom",
  "tree",
  "garden",
] as const;

export const TRAVELER_STAGES = [
  "seeker",
  "wayfarer",
  "pilgrim",
  "guidingLight",
  "travellingSpirit",
] as const;

export type CompanionStage =
  | (typeof GARDEN_STAGES)[number]
  | (typeof TRAVELER_STAGES)[number];

/** Highest level of each stage but the last. */
const STAGE_TOPS = [1, 3, 5, 8] as const;

/** How far the Companion has grown at a level, in its theme. */
export const companionStage = (
  theme: CompanionTheme,
  level: number
): CompanionStage => {
  const stages = theme === "garden" ? GARDEN_STAGES : TRAVELER_STAGES;
  const index = STAGE_TOPS.findIndex((top) => level <= top);
  return stages[index === -1 ? stages.length - 1 : index] ?? stages[0];
};
