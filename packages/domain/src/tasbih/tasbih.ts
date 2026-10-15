import { z } from "zod";

/**
 * Tasbih al-Zahra's id. The same on every device, so the Believer has exactly
 * one, and sync merges it instead of adding a second.
 */
export const TASBIH_AL_ZAHRA_ID = "tasbih-al-zahra";

export const isTasbihAlZahra = (tasbihId: string): boolean =>
  tasbihId === TASBIH_AL_ZAHRA_ID;

/** Raised when asked to rename or delete Tasbih al-Zahra. */
export class TasbihAlZahraIsPermanentError extends Error {
  constructor(action: "rename" | "delete") {
    super(`Tasbih al-Zahra cannot be ${action}d`);
    this.name = "TasbihAlZahraIsPermanentError";
  }
}

/** The recorded result of one completed round of a Tasbih. */
export const dhikrSessionSchema = z.object({
  id: z.string().min(1),
  tasbihId: z.string().min(1),
  count: z.number().int().positive(),
  /** Milliseconds since the epoch. */
  completedAt: z.number().int().nonnegative(),
});

export type DhikrSession = z.infer<typeof dhikrSessionSchema>;
