import { alertTypeOf } from "@alrisali/domain/reminders";
import type { ReminderRule } from "@alrisali/domain/reminders";
import { Item } from "panelui-native";
import { useTranslation } from "react-i18next";

import { launchLanguage } from "@/shared/lib/preferences";

import type { ReminderKey } from "../utils/reminder-key";
import { summarySentence } from "../utils/summary";
import { AlertTypeIcon } from "./alert-type-icon";
import { ForwardChevron } from "./forward-chevron";

/** A Prayer Time's name and what its Reminder will do, one sentence; opens its sheet. */
export const ReminderRow = ({
  reminderKey,
  rule,
  onPress,
}: {
  reminderKey: ReminderKey;
  rule: ReminderRule;
  onPress: () => void;
}) => {
  const { t } = useTranslation("reminders");
  const type = alertTypeOf(rule);

  return (
    <Item size="sm" testID={`reminder-row-${reminderKey}`} onPress={onPress}>
      <Item.Media variant="icon">
        <AlertTypeIcon
          type={type}
          tone={type === "off" ? "muted-foreground" : "foreground"}
        />
      </Item.Media>
      <Item.Content>
        <Item.Title>{t(`names.${reminderKey}`)}</Item.Title>
        <Item.Description>
          {summarySentence(t, launchLanguage, reminderKey, rule)}
        </Item.Description>
      </Item.Content>
      <Item.Actions>
        <ForwardChevron />
      </Item.Actions>
    </Item>
  );
};
