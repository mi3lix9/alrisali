import { z } from "zod";

const NAME_MAX_LENGTH = 80;
const NOTES_MAX_LENGTH = 1000;

/** What the Believer gives an Open Tasbih: a name, an optional target, notes. */
export const openTasbihDetailsSchema = z.object({
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  target: z.number().int().positive().nullable(),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX_LENGTH)
    .nullish()
    .transform((notes) => notes || null),
});

export type OpenTasbihDetails = z.output<typeof openTasbihDetailsSchema>;
export type OpenTasbihDetailsInput = z.input<typeof openTasbihDetailsSchema>;

/** `target` on the tap that reaches the target; `tap` on every other. */
export type OpenTasbihFeedback = "tap" | "target";

export interface OpenTasbihTap {
  count: number;
  feedback: OpenTasbihFeedback;
}

/**
 * Counts one tap. The target is signalled once, on the tap that reaches it;
 * counting carries on past it until the Believer saves or resets.
 */
export const tapOpenTasbih = ({
  count,
  target,
}: {
  count: number;
  target: number | null;
}): OpenTasbihTap => {
  const next = count + 1;
  return { count: next, feedback: next === target ? "target" : "tap" };
};
