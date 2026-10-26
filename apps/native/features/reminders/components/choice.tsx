import { Item } from "panelui-native";
import { CheckIcon } from "panelui-native/icons";
import type { ReactNode } from "react";

/** One choice in a list: a radio row with a check when chosen. */
export const Choice = ({
  testID,
  title,
  description,
  selected,
  disabled = false,
  start,
  end,
  onPress,
}: {
  testID: string;
  title: string;
  description?: string | undefined;
  selected: boolean;
  disabled?: boolean;
  /** Shown before the title (an icon). */
  start?: ReactNode;
  /** Shown before the check (a preview button). */
  end?: ReactNode;
  onPress: () => void;
}) => (
  <Item
    size="sm"
    testID={testID}
    accessibilityRole="radio"
    accessibilityState={{ selected, disabled }}
    disabled={disabled}
    onPress={onPress}
  >
    {start ? <Item.Media variant="icon">{start}</Item.Media> : null}
    <Item.Content>
      <Item.Title>{title}</Item.Title>
      {description ? <Item.Description>{description}</Item.Description> : null}
    </Item.Content>
    <Item.Actions>
      {end}
      {selected ? <CheckIcon size={20} /> : null}
    </Item.Actions>
  </Item>
);
