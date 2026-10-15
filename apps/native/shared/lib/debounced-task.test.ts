import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDebouncedTask } from "./debounced-task";

describe(createDebouncedTask, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pushes once after a burst of writes settles", () => {
    const push = vi.fn<() => void>();
    const task = createDebouncedTask({ run: push, delayMs: 2000 });

    task.schedule();
    vi.advanceTimersByTime(1500);
    task.schedule();
    task.schedule();
    vi.advanceTimersByTime(1999);
    expect(push).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(push).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(10_000);
    expect(push).toHaveBeenCalledOnce();
  });

  it("drops a scheduled push when cancelled, as on sign-out", () => {
    const push = vi.fn<() => void>();
    const task = createDebouncedTask({ run: push, delayMs: 2000 });

    task.schedule();
    task.cancel();
    vi.advanceTimersByTime(10_000);

    expect(push).not.toHaveBeenCalled();
  });
});
