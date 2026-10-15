/** One Quran Foundation ayah-by-ayah recitation. */
export interface ReciterEntry {
  id: number;
  name: { ar: string; en: string };
  style: string | null;
}

/** Where one ayah's recitation streams from. */
export interface AyahAudioEntry {
  /** `surah:ayah`. */
  ayah: string;
  url: string;
}

/**
 * Where recitation comes from: the Quran Foundation audio API, or a
 * stand-in in tests.
 */
export interface RecitationSource {
  reciters: () => Promise<ReciterEntry[]>;
  /** Every ayah of the surah, in order, as the reciter recites it. */
  surahAudio: (reciterId: number, surah: number) => Promise<AyahAudioEntry[]>;
}
