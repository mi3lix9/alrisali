import { advanceAutoScroll } from "@alrisali/domain/books";
import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import type {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

/**
 * Drives a list down the screen at the chosen speed while `active`. It holds
 * still while a finger is on the list or the list is gliding from a flick,
 * resumes when the finger lifts, and calls `onFinish` at the end of the text.
 * Spread the returned props on the list.
 */
export const useAutoScroll = <T>({
  listRef,
  active,
  speed,
  onFinish,
}: {
  listRef: RefObject<FlatList<T> | null>;
  active: boolean;
  speed: number;
  onFinish: () => void;
}) => {
  const offsetRef = useRef(0);
  const contentRef = useRef(0);
  const viewportRef = useRef(0);
  const touchingRef = useRef(false);
  const glidingRef = useRef(false);
  const speedRef = useRef(speed);
  const finishRef = useRef(onFinish);
  useEffect(() => {
    speedRef.current = speed;
    finishRef.current = onFinish;
  }, [speed, onFinish]);

  useEffect(() => {
    if (!active) {
      return;
    }
    let frame = 0;
    let last: number | undefined;
    const tick = (now: number) => {
      const elapsedMs = last === undefined ? 0 : now - last;
      last = now;
      if (!touchingRef.current && !glidingRef.current) {
        const next = advanceAutoScroll({
          offset: offsetRef.current,
          speed: speedRef.current,
          elapsedMs,
          maxOffset: contentRef.current - viewportRef.current,
        });
        if (next.offset !== offsetRef.current) {
          offsetRef.current = next.offset;
          listRef.current?.scrollToOffset({
            offset: next.offset,
            animated: false,
          });
        }
        if (next.finished) {
          finishRef.current();
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, listRef]);

  const release = useCallback(() => {
    touchingRef.current = false;
  }, []);

  return {
    scrollEventThrottle: 16,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offsetRef.current = event.nativeEvent.contentOffset.y;
    },
    onContentSizeChange: (_width: number, height: number) => {
      contentRef.current = height;
    },
    onLayout: (event: LayoutChangeEvent) => {
      viewportRef.current = event.nativeEvent.layout.height;
    },
    onTouchStart: () => {
      touchingRef.current = true;
    },
    onTouchEnd: release,
    onTouchCancel: release,
    onMomentumScrollBegin: () => {
      glidingRef.current = true;
    },
    onMomentumScrollEnd: () => {
      glidingRef.current = false;
    },
  };
};
