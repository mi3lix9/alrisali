import type { Salah } from "@alrisali/domain/shared";
import type { Temporal } from "temporal-polyfill";
import { create } from "zustand";

export interface KhushuTarget {
  date: Temporal.PlainDate;
  salah: Salah;
}

interface KhushuSheetState {
  /** The Salah whose Khushu the sheet is rating, or null when closed. */
  target: KhushuTarget | null;
  open: (target: KhushuTarget) => void;
  close: () => void;
}

/**
 * The one Khushu sheet's open state: a tick (`SalahLogged`) or a Khushu
 * button opens it, wherever the sheet itself is mounted.
 */
export const useKhushuSheet = create<KhushuSheetState>()((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));
