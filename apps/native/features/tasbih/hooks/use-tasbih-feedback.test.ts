// @vitest-environment jsdom
import type {
  TasbihFeedbackMode,
  TasbihSettings,
} from "@alrisali/domain/tasbih";
import type { UseQueryResult } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTasbihSettings } from "../data/tasbih-settings";
import { playHaptic } from "../utils/haptics";
import { playTasbihSound } from "../utils/sounds";
import type { preloadTasbihSounds } from "../utils/sounds";
import { useTasbihFeedback } from "./use-tasbih-feedback";

type UseTasbihSettings = typeof useTasbihSettings;

vi.mock(import("../data/tasbih-settings"), () => ({
  useTasbihSettings: vi.fn<UseTasbihSettings>(),
}));
vi.mock(import("../utils/haptics"), () => ({
  playHaptic: vi.fn<typeof playHaptic>(() => Promise.resolve()),
}));
vi.mock(import("../utils/sounds"), () => ({
  playTasbihSound: vi.fn<typeof playTasbihSound>(),
  preloadTasbihSounds: vi.fn<typeof preloadTasbihSounds>(),
}));

const chosen = (feedbackMode?: TasbihFeedbackMode) =>
  vi.mocked(useTasbihSettings).mockReturnValue({
    data: feedbackMode ? { feedbackMode } : undefined,
    isError: false,
  } as UseQueryResult<TasbihSettings>);

describe(useTasbihFeedback, () => {
  beforeEach(() => {
    vi.mocked(playHaptic).mockClear();
    vi.mocked(playTasbihSound).mockClear();
  });

  it("plays the cue's sound and vibration in sound and haptic mode", () => {
    chosen("sound-and-haptic");
    const { result } = renderHook(() => useTasbihFeedback());

    result.current("step");

    expect(playHaptic).toHaveBeenCalledWith("step");
    expect(playTasbihSound).toHaveBeenCalledWith("step");
  });

  it("only vibrates in haptic mode", () => {
    chosen("haptic");
    const { result } = renderHook(() => useTasbihFeedback());

    result.current("tap");

    expect(playHaptic).toHaveBeenCalledWith("tap");
    expect(playTasbihSound).not.toHaveBeenCalled();
  });

  it("makes no sound and no vibration in silent mode", () => {
    chosen("silent");
    const { result } = renderHook(() => useTasbihFeedback());

    result.current("tap");
    result.current("done");

    expect(playHaptic).not.toHaveBeenCalled();
    expect(playTasbihSound).not.toHaveBeenCalled();
  });

  it("stays quiet until the Believer's choice is read", () => {
    chosen();
    const { result } = renderHook(() => useTasbihFeedback());

    result.current("tap");

    expect(playHaptic).not.toHaveBeenCalled();
    expect(playTasbihSound).not.toHaveBeenCalled();
  });

  it("follows a new choice on the next tap", () => {
    chosen("silent");
    const { result, rerender } = renderHook(() => useTasbihFeedback());
    chosen("haptic");
    rerender();

    result.current("tap");

    expect(playHaptic).toHaveBeenCalledWith("tap");
  });
});
