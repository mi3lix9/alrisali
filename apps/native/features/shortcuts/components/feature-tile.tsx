import type { Href } from "expo-router";
import { router } from "expo-router";
import { Text } from "panelui-native";
import type { ReactNode } from "react";
import { Pressable } from "react-native";

/**
 * One square of a feature grid, filling its cell: an icon over a label,
 * opening `href`.
 */
export const FeatureTile = ({
  icon,
  label,
  href,
  testID,
}: {
  icon: ReactNode;
  label: string;
  href: Href;
  testID: string;
}) => (
  <Pressable
    testID={testID}
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={() => router.push(href)}
    className="bg-card border-border w-full items-center gap-2 rounded-xl border px-1 py-3"
  >
    {icon}
    <Text size="xs" weight="semibold" numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);
