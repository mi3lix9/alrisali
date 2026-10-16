import { create } from "zustand";

// A link that arrived before the first run was over. The shell shows only
// onboarding until then, so the link waits here and opens when it ends.

interface PendingLinkState {
  path: string | null;
  hold: (path: string) => void;
  take: () => string | null;
}

export const usePendingLink = create<PendingLinkState>()((set, get) => ({
  path: null,
  hold: (path) => set({ path }),
  take: () => {
    const { path } = get();
    set({ path: null });
    return path;
  },
}));
