import { z } from "zod";

/**
 * The five obligatory daily prayers, in the order they fall. Shared because
 * the Prayer Log, Khushu, Reminders and the Prayer Assistant all name them.
 */
export const SALAH = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export type Salah = (typeof SALAH)[number];

export const salahSchema = z.enum(SALAH);
