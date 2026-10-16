import { Item } from "panelui-native";
import { CheckIcon } from "panelui-native/icons";
import type { ReactNode } from "react";

interface ActionRowProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  /** Marks a state the action has already reached, with a check at the end. */
  selected?: boolean;
  disabled?: boolean;
  /** What a screen reader says instead of `label`, when the two differ. */
  accessibilityLabel?: string;
  /** `<feature>-<thing>`, e.g. `ayah-sheet-play`. */
  testID: string;
}

/**
 * One labelled action in a vertical action list, such as the ayah sheet's.
 * Rows that other features add to such a list use it so the list reads as one.
 */
export const ActionRow = ({
  icon,
  label,
  onPress,
  selected = false,
  disabled = false,
  accessibilityLabel,
  testID,
}: ActionRowProps) => (
  <Item
    size="sm"
    variant="outline"
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? label}
    accessibilityState={{ selected, disabled }}
    disabled={disabled}
    onPress={onPress}
    testID={testID}
  >
    <Item.Media>{icon}</Item.Media>
    <Item.Content>
      <Item.Title>{label}</Item.Title>
    </Item.Content>
    {selected ? (
      <Item.Actions>
        <CheckIcon size={18} />
      </Item.Actions>
    ) : null}
  </Item>
);
