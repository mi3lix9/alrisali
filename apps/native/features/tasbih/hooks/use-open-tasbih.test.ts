// @vitest-environment jsdom
import type { OpenTasbih } from "@alrisali/db-user/tasbih";
import type { DhikrSession, TasbihSettings } from "@alrisali/domain/tasbih";
import type { UseQueryResult } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { AppState } from "react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveOpenTasbihSession } from "../data/tasbih";
import type { saveOpenTasbihCount, useSavedOpenTasbih } from "../data/tasbih";
import type { useTasbihSettings } from "../data/tasbih-settings";
import { playHaptic } from "../utils/haptics";
import { playTasbihSound } from "../utils/sounds";
import type { preloadTasbihSounds } from "../utils/sounds";
import { useOpenTasbih } from "./use-open-tasbih";

type UseSavedOpenTasbih = typeof useSavedOpenTasbih;
type SaveOpenTasbihCount = typeof saveOpenTasbihCount;
type SaveOpenTasbihSession = typeof saveOpenTasbihSession;
type PlayHaptic = typeof playHaptic;

const saved: OpenTasbih = {
  id: "open-1",
  kind: "open",
  name: "Salawat",
  target: 33,
  notes: null,
  count: 40,
};

vi.mock(import("../data/tasbih"), () => ({
  useSavedOpenTasbih: vi.fn<UseSavedOpenTasbih>(
    () => ({ data: saved, isError: false }) as ReturnType<UseSavedOpenTasbih>
  ),
  saveOpenTasbihCount: vi.fn<SaveOpenTasbihCount>(() => Promise.resolve()),
  saveOpenTasbihSession: vi.fn<SaveOpenTasbihSession>(),
}));
vi.mock(import("../data/tasbih-settings"), () => ({
  useTasbihSettings: vi.fn<typeof useTasbihSettings>(
    () =>
      ({
        data: { feedbackMode: "silent" },
        isError: false,
      }) as UseQueryResult<TasbihSettings>
  ),
}));
vi.mock(import("../utils/haptics"), () => ({
  playHaptic: vi.fn<PlayHaptic>(),
}));
vi.mock(import("../utils/sounds"), () => ({
  playTasbihSound: vi.fn<typeof playTasbihSound>(),
  preloadTasbihSounds: vi.fn<typeof preloadTasbihSounds>(),
}));
vi.mock(import("expo-crypto"), () => ({ randomUUID: () => "session-1" }));
vi.mock(import("@sentry/react-native"), () => ({
  captureException: vi.fn<() => string>(),
}));
vi.mock(import("react-native"), () => ({
  AppState: {
    addEventListener: () => ({ remove: () => null }),
  } as Partial<typeof AppState> as typeof AppState,
}));

/** A save the test settles by hand, to look at the counter mid-write. */
const pendingSave = () => {
  const { promise, resolve, reject } = Promise.withResolvers<null>();
  vi.mocked(saveOpenTasbihSession).mockImplementation(
    async (session: DhikrSession) => {
      await promise;
      return session;
    }
  );
  return { resolve, reject };
};

describe(useOpenTasbih, () => {
  beforeEach(() => {
    vi.mocked(saveOpenTasbihSession).mockReset();
  });

  it("counts every tap at once in silent mode, with no sound or vibration", () => {
    const { result } = renderHook(() => useOpenTasbih("open-1"));

    act(() => result.current.tap());
    expect(result.current.count).toBe(41);
    act(() => result.current.tap());
    expect(result.current.count).toBe(42);

    expect(playHaptic).not.toHaveBeenCalled();
    expect(playTasbihSound).not.toHaveBeenCalled();
  });

  it("says the session is saved only once the save succeeds", async () => {
    const save = pendingSave();
    const { result } = renderHook(() => useOpenTasbih("open-1"));

    act(() => result.current.saveSession());

    expect(result.current.notice).toBeNull();

    await act(() => {
      save.resolve(null);
      return Promise.resolve();
    });

    expect(result.current.notice).toBe("session-saved");
    expect(result.current.count).toBe(0);
  });

  it("brings the count back and says so when the save fails", async () => {
    const save = pendingSave();
    const { result } = renderHook(() => useOpenTasbih("open-1"));

    act(() => result.current.saveSession());
    await act(() => {
      save.reject(new Error("disk full"));
      return Promise.resolve();
    });

    await waitFor(() => expect(result.current.notice).toBe("session-failed"));
    expect(result.current.count).toBe(40);
  });

  it("keeps the taps made while a failed save was running", async () => {
    const save = pendingSave();
    const { result } = renderHook(() => useOpenTasbih("open-1"));

    act(() => result.current.saveSession());
    act(() => result.current.tap());
    act(() => result.current.tap());
    await act(() => {
      save.reject(new Error("disk full"));
      return Promise.resolve();
    });

    await waitFor(() => expect(result.current.notice).toBe("session-failed"));
    expect(result.current.count).toBe(42);
  });
});
