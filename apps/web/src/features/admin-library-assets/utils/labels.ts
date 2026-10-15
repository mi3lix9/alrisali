import type {
  LibraryAssetKind,
  LibraryCategory,
} from "@alrisali/domain/library-assets";

export const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  quran: "Quran",
  hadith: "Hadith",
  dua: "Supplications",
  fiqh: "Jurisprudence",
  history: "History",
  general: "General",
};

export const KIND_LABELS: Record<LibraryAssetKind, string> = {
  pdf: "PDF",
  audio: "Audio",
  video: "Video",
  text: "Structured text",
};
