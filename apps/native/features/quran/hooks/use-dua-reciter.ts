import { DEFAULT_QURAN_READER_SETTINGS } from "@alrisali/domain/quran";

import { useQuranReaderSettings } from "../data/reader-settings";

/** The reciter chosen in the reader, which the duas are recited by too. */
export const useDuaReciter = (): string =>
  useQuranReaderSettings().data?.reciter ??
  DEFAULT_QURAN_READER_SETTINGS.reciter;
