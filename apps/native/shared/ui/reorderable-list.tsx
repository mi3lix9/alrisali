import { GripVerticalIcon } from "panelui-native/icons";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";
import type { AccessibilityActionEvent } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

// A list the Believer reorders by dragging a row's handle, built on Gesture
// Handler and Reanimated (no native module). Rows have one fixed height and
// sit at their slot; while a row is dragged, the others make room for it.
// The slots live on the UI thread, so the list keeps its order when the new
// one arrives from React.

const SETTLE = { duration: 150 };

/** Each row's slot by key. */
type Slots = Record<string, number>;

const slotsOf = (keys: readonly string[]): Slots =>
  Object.fromEntries(keys.map((key, slot) => [key, slot]));

/** The slots after the row `key` moves to `to`, the others closing up. */
const moveSlot = (slots: Slots, key: string, to: number): Slots => {
  "worklet";
  const order: string[] = [];
  for (const [candidate, slot] of Object.entries(slots)) {
    order[slot] = candidate;
  }
  const rest = order.filter((candidate) => candidate !== key);
  rest.splice(to, 0, key);
  return Object.fromEntries(rest.map((candidate, slot) => [candidate, slot]));
};

interface RowProps {
  rowKey: string;
  count: number;
  rowHeight: number;
  slots: SharedValue<Slots>;
  dragging: SharedValue<string | null>;
  onMove: (from: number, to: number) => void;
  onDraggingChange: (dragging: boolean) => void;
  children: ReactNode;
}

const Row = ({
  rowKey,
  count,
  rowHeight,
  slots,
  dragging,
  onMove,
  onDraggingChange,
  children,
}: RowProps) => {
  const from = useSharedValue(0);
  const top = useSharedValue(0);

  const pan = usePanGesture({
    minDistance: 0,
    onActivate: () => {
      const start = slots.get()[rowKey] ?? 0;
      from.set(start);
      top.set(start * rowHeight);
      dragging.set(rowKey);
      scheduleOnRN(onDraggingChange, true);
    },
    onUpdate: (event) => {
      const dragged = from.get() * rowHeight + event.translationY;
      top.set(dragged);
      const over = Math.min(
        Math.max(Math.round(dragged / rowHeight), 0),
        count - 1
      );
      const current = slots.get();
      if (over !== current[rowKey]) {
        slots.set(moveSlot(current, rowKey, over));
      }
    },
    onDeactivate: () => {
      const start = from.get();
      const to = slots.get()[rowKey] ?? start;
      if (to !== start) {
        scheduleOnRN(onMove, start, to);
      }
    },
    onFinalize: () => {
      dragging.set(null);
      scheduleOnRN(onDraggingChange, false);
    },
  });

  const style = useAnimatedStyle(() => {
    const slotTop = (slots.get()[rowKey] ?? 0) * rowHeight;
    const lifted = dragging.get() === rowKey;
    return {
      top: lifted ? top.get() : withTiming(slotTop, SETTLE),
      zIndex: lifted ? 1 : 0,
      opacity: lifted ? 0.9 : 1,
    };
  });

  return (
    <Animated.View
      style={[
        { position: "absolute", start: 0, end: 0, height: rowHeight },
        style,
      ]}
    >
      <View className="bg-background h-full flex-row items-center">
        <View className="flex-1">{children}</View>
        {/* Screen readers move rows with their actions, not the handle. */}
        <GestureDetector gesture={pan}>
          <View
            className="h-full justify-center ps-3"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <GripVerticalIcon size={20} />
          </View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
};

/** What a row's accessible element carries in place of dragging. */
export interface RowAccessibility {
  accessibilityActions: { name: string; label: string }[];
  onAccessibilityAction: (event: AccessibilityActionEvent) => void;
}

export interface ReorderableListProps<T> {
  items: readonly T[];
  keyOf: (item: T) => string;
  rowHeight: number;
  /** A row's content; spread `accessibility` on its main accessible element. */
  renderRow: (item: T, accessibility: RowAccessibility) => ReactNode;
  /** The row at `from` was dropped at `to`. */
  onMove: (from: number, to: number) => void;
  /** A drag began or ended; a scrolling parent should hold still meanwhile. */
  onDraggingChange: (dragging: boolean) => void;
  /** The screen-reader actions that move a row instead of dragging. */
  labels: { moveUp: string; moveDown: string };
}

/**
 * Rows reordered by dragging their handle. Screen readers move a row with
 * its "move up" and "move down" actions instead.
 */
export const ReorderableList = <T,>({
  items,
  keyOf,
  rowHeight,
  renderRow,
  onMove,
  onDraggingChange,
  labels,
}: ReorderableListProps<T>) => {
  const keys = items.map(keyOf);
  const slots = useSharedValue(slotsOf(keys));
  const dragging = useSharedValue<string | null>(null);
  const order = keys.join("\n");

  // The new order from React matches the slots a drag left, so this only
  // corrects them when the order changed elsewhere (another device's sync,
  // or a screen reader's move).
  useEffect(() => {
    slots.set(slotsOf(order.split("\n")));
  }, [order, slots]);

  const accessibilityActions = [
    { name: "moveUp", label: labels.moveUp },
    { name: "moveDown", label: labels.moveDown },
  ];

  return (
    <View style={{ height: items.length * rowHeight }}>
      {items.map((item, index) => (
        <Row
          key={keyOf(item)}
          rowKey={keyOf(item)}
          count={items.length}
          rowHeight={rowHeight}
          slots={slots}
          dragging={dragging}
          onMove={onMove}
          onDraggingChange={onDraggingChange}
        >
          {renderRow(item, {
            accessibilityActions,
            onAccessibilityAction: ({ nativeEvent }) => {
              const to =
                nativeEvent.actionName === "moveUp" ? index - 1 : index + 1;
              if (to >= 0 && to < items.length) {
                onMove(index, to);
              }
            },
          })}
        </Row>
      ))}
    </View>
  );
};
