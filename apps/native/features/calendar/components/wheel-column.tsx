import { Text } from "panelui-native";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import type {
  AccessibilityActionEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewInstance,
} from "react-native";

export interface WheelItem {
  value: number;
  label: string;
}

const ITEM_HEIGHT = 40;
/** Rows above and below the chosen one. */
const SIDE_ROWS = 2;
const HEIGHT = ITEM_HEIGHT * (SIDE_ROWS * 2 + 1);

const ACCESSIBILITY_ACTIONS = [
  { name: "increment" },
  { name: "decrement" },
] as const;

/**
 * One snapping column of a wheel picker: the chosen item sits in the
 * middle band, the neighbours above and below. Scroll or tap an item to
 * choose it; screen readers adjust it a step at a time.
 */
export const WheelColumn = ({
  items,
  selected,
  onChange,
  accessibilityLabel,
  testID,
}: {
  items: readonly WheelItem[];
  selected: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
  testID?: string;
}) => {
  const scroll = useRef<ScrollViewInstance>(null);
  const offset = useRef<number | null>(null);
  const index = Math.max(
    0,
    items.findIndex((item) => item.value === selected)
  );
  const current = items[index];

  // Follows a choice made elsewhere (another column, Today, a swap) without
  // fighting the Believer's own scroll, which already rests there. The first
  // position waits for the content (below).
  useEffect(() => {
    const target = index * ITEM_HEIGHT;
    if (offset.current === null || offset.current === target) {
      return;
    }
    scroll.current?.scrollTo({ y: target, animated: true });
    offset.current = target;
  }, [index]);

  const settle = (y: number) => {
    const rested = Math.min(
      items.length - 1,
      Math.max(0, Math.round(y / ITEM_HEIGHT))
    );
    offset.current = rested * ITEM_HEIGHT;
    const item = items[rested];
    if (item && item.value !== selected) {
      onChange(item.value);
    }
  };

  const onAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) => {
    const step = nativeEvent.actionName === "increment" ? 1 : -1;
    const item = items[index + step];
    if (item) {
      onChange(item.value);
    }
  };

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: current?.label }}
      accessibilityActions={ACCESSIBILITY_ACTIONS}
      onAccessibilityAction={onAccessibilityAction}
      className="flex-1"
      style={{ height: HEIGHT }}
    >
      <View
        pointerEvents="none"
        className="bg-muted absolute inset-x-0 rounded-xl"
        style={{ top: ITEM_HEIGHT * SIDE_ROWS, height: ITEM_HEIGHT }}
      />
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          // Opens at the chosen item once there is content to scroll.
          if (offset.current === null) {
            offset.current = index * ITEM_HEIGHT;
            scroll.current?.scrollTo({ y: offset.current, animated: false });
          }
        }}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * SIDE_ROWS }}
        onMomentumScrollEnd={({
          nativeEvent,
        }: NativeSyntheticEvent<NativeScrollEvent>) =>
          settle(nativeEvent.contentOffset.y)
        }
        onScrollEndDrag={({
          nativeEvent,
        }: NativeSyntheticEvent<NativeScrollEvent>) => {
          // A drag released without a fling never gets a momentum end.
          if ((nativeEvent.velocity?.y ?? 0) === 0) {
            settle(nativeEvent.contentOffset.y);
          }
        }}
      >
        {items.map((item) => {
          const chosen = item.value === selected;
          return (
            <Pressable
              key={item.value}
              testID={testID ? `${testID}-${item.value}` : undefined}
              className="items-center justify-center"
              style={{ height: ITEM_HEIGHT }}
              onPress={() => onChange(item.value)}
            >
              <Text
                weight={chosen ? "semibold" : "normal"}
                muted={!chosen}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
