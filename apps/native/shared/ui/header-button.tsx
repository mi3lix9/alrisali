import { Stack } from "expo-router";
import type { SFSymbol } from "expo-symbols";
import { Button } from "panelui-native";
import type { ReactNode } from "react";
import { Platform } from "react-native";

interface HeaderButtonProps {
  /** Leading ("left") or trailing ("right") edge of the header. */
  placement: "left" | "right";
  /** Read aloud, and shown as the button's text when it has no icon. */
  label: string;
  /** The iOS toolbar's SF Symbol. */
  symbol: SFSymbol;
  /** The Android header's icon; without one the button shows its label. */
  icon?: ReactNode;
  onPress: () => void;
}

/**
 * A button in the current screen's header. iOS uses the native toolbar with
 * an SF Symbol. Android's native toolbar drops a button without an image
 * icon, so there it is a Panel UI button in the header instead.
 */
export const HeaderButton = ({
  placement,
  label,
  symbol,
  icon,
  onPress,
}: HeaderButtonProps) => {
  if (Platform.OS === "ios") {
    return (
      <Stack.Toolbar placement={placement}>
        <Stack.Toolbar.Button icon={symbol} onPress={onPress}>
          {label}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    );
  }
  const button = () =>
    icon ? (
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={label}
        onPress={onPress}
      >
        {icon}
      </Button>
    ) : (
      <Button variant="ghost" size="sm" onPress={onPress}>
        {label}
      </Button>
    );
  return (
    <Stack.Screen
      options={
        placement === "left" ? { headerLeft: button } : { headerRight: button }
      }
    />
  );
};
