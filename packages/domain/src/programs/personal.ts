import { z } from "zod";

import { actSchema, EMPTY_BILINGUAL_TEXT, NAME_MAX_LENGTH } from "./program";
import type { Act, ActInput, ActSalah } from "./program";

const DESCRIPTION_MAX_LENGTH = 4000;

export const personalProgramNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(NAME_MAX_LENGTH);

/**
 * A Program the Believer built from Acts. It lives in their own database, so
 * only they can see it or subscribe to it. Its name and description are in
 * the Believer's own words, in whichever language they wrote.
 */
export const personalProgramSchema = z.object({
  id: z.string().trim().min(1),
  name: personalProgramNameSchema,
  description: z.string().trim().max(DESCRIPTION_MAX_LENGTH),
  /** In the Believer's order. */
  acts: z
    .array(actSchema)
    .refine(
      (acts) => new Set(acts.map(({ id }) => id)).size === acts.length,
      "Each Act needs its own id"
    ),
});

export type PersonalProgram = z.output<typeof personalProgramSchema>;
export type PersonalProgramInput = z.input<typeof personalProgramSchema>;

/** When an Act is done: its schedule and the Salah it goes with, if any. */
export interface ActTiming {
  schedule: ActInput["schedule"];
  salah: ActSalah;
}

/**
 * A plain Act the Believer writes, named in their own words (the same name
 * shows in either app language). Throws on a blank name or no weekdays.
 */
export const writtenAct = ({
  id,
  name,
  ...timing
}: ActTiming & { id: string; name: string }): Act =>
  actSchema.parse({
    id,
    name: { ar: name, en: name },
    description: EMPTY_BILINGUAL_TEXT,
    ...timing,
    detail: { type: "regular" },
  });

/**
 * Copies an Act (from an Official Program, say) into a Personal Program under
 * a new id; its dua or prayer comes with it.
 */
export const copyAct = (act: Act, id: string): Act => ({ ...act, id });

/**
 * Changes when a Personal Program's Act is done, and its name when one is
 * given (in both languages, as the Believer wrote it). Its dua or prayer is
 * kept.
 */
export const editAct = (
  act: Act,
  { name, ...timing }: ActTiming & { name?: string }
): Act =>
  actSchema.parse({
    ...act,
    ...timing,
    name: name === undefined ? act.name : { ar: name, en: name },
  });

/**
 * A Personal Program as the Acts of a date read it: always available, like
 * an active General Program.
 */
export const asProgramWithActs = <P extends PersonalProgram>(
  program: P
): P & { category: "general"; active: true } => ({
  ...program,
  category: "general",
  active: true,
});
