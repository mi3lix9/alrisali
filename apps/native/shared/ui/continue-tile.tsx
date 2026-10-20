import { Card, Item, Text } from "panelui-native";

/**
 * A card of Home's Continue row: what the Believer was doing (label), where
 * (title, caption), the whole card one tap back into it.
 */
export const ContinueTile = ({
  label,
  title,
  caption,
  onPress,
  testID,
}: {
  label: string;
  title: string;
  caption?: string | undefined;
  onPress: () => void;
  testID?: string;
}) => (
  <Card className="w-60">
    <Item
      orientation="vertical"
      className="min-h-28 gap-1"
      accessibilityLabel={[label, title, caption].filter(Boolean).join(", ")}
      onPress={onPress}
      testID={testID}
    >
      <Text size="sm" muted numberOfLines={1}>
        {label}
      </Text>
      <Text size="lg" weight="semibold" numberOfLines={2}>
        {title}
      </Text>
      {caption ? (
        <Text size="xs" muted numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </Item>
  </Card>
);
