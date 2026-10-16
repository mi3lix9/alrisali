import type { AyahKey } from "@alrisali/domain/quran";
import { createContext, useContext } from "react";

export interface ReaderLastRead {
  lastReadAyah: AyahKey | null;
  /** Marks the ayah as where the Believer stopped. */
  setLastRead: (ayah: AyahKey) => void;
}

/** The open reader's Last-Read Ayah, for actions in its ayah sheet. */
export const ReaderLastReadContext = createContext<ReaderLastRead | null>(null);

export const useReaderLastRead = (): ReaderLastRead => {
  const value = useContext(ReaderLastReadContext);
  if (!value) {
    throw new Error("useReaderLastRead is used outside the Quran reader");
  }
  return value;
};
