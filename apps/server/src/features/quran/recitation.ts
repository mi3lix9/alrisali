import { os } from "@/shared/lib/orpc";

/** Open to Guests: recitation needs no account. */
export const reciters = os.quran.reciters.handler(({ context }) =>
  context.recitation.reciters()
);

export const surahAudio = os.quran.surahAudio.handler(({ context, input }) =>
  context.recitation.surahAudio(input.reciterId, input.surah)
);
