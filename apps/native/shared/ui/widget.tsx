import { Card, Item, Text } from "panelui-native";
import type { ReactNode } from "react";
import { View } from "react-native";

/**
 * Two `WidgetTile`s side by side on Home's widget grid, equal in width and
 * height. The row follows the layout direction, so the first tile sits at the
 * start.
 */
export const WidgetRow = ({ children }: { children: ReactNode }) => (
  <View className="flex-row items-stretch gap-4">{children}</View>
);

/**
 * A half-width widget: a small label, a value, a caption, the whole tile one
 * tap into the screen it summarises.
 */
export const WidgetTile = ({
  label,
  value,
  caption,
  accessibilityLabel,
  onPress,
  testID,
}: {
  label: string;
  value: string;
  caption?: string | undefined;
  /** Read instead of the tile's text when it needs joining into a sentence. */
  accessibilityLabel?: string;
  onPress: () => void;
  testID?: string;
}) => (
  <Card className="flex-1">
    <Item
      orientation="vertical"
      className="min-h-28 flex-1 gap-1"
      accessibilityLabel={
        accessibilityLabel ?? [label, value, caption].filter(Boolean).join(", ")
      }
      onPress={onPress}
      testID={testID}
    >
      <Text size="sm" muted numberOfLines={1}>
        {label}
      </Text>
      <Text
        size="lg"
        weight="semibold"
        numberOfLines={2}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
      {caption ? (
        <Text size="xs" muted numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </Item>
  </Card>
);
