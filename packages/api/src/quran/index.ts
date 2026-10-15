import { oc } from "@orpc/contract";
import { z } from "zod";

/** A Quran Foundation ayah-by-ayah recitation a Believer can pick. */
export const reciterSchema = z.object({
  /** The Quran Foundation recitation id. */
  id: z.number().int().positive(),
  name: z.object({ ar: z.string().min(1), en: z.string().min(1) }),
  /** As Quran Foundation names it: "Murattal", "Mujawwad", "Muallim"… */
  style: z.string().nullable(),
});

export type Reciter = z.infer<typeof reciterSchema>;

/** Where one ayah's recitation streams from. */
export const ayahAudioSchema = z.object({
  /** `surah:ayah`. */
  ayah: z.string().regex(/^\d{1,3}:\d{1,3}$/u),
  url: z.url(),
});

export type AyahAudio = z.infer<typeof ayahAudioSchema>;

/**
 * Recitation from the Quran Foundation audio API. The server holds the
 * Quran Foundation credentials; the device streams the returned URLs.
 * Guests may call these.
 */
export const quranContract = {
  reciters: oc.output(z.array(reciterSchema)),
  surahAudio: oc
    .input(
      z.object({
        reciterId: z.number().int().positive(),
        surah: z.number().int().min(1).max(114),
      })
    )
    .output(z.array(ayahAudioSchema)),
};
