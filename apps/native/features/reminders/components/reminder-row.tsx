import "../i18n";
import type { ReminderRule } from "@alrisali/domain/reminders";
import { Item } from "panelui-native";
import { AudioLinesIcon, BellIcon, MicIcon, XIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

import { launchLanguage } from "@/shared/lib/preferences";

import { useAdhanVoices } from "../hooks/use-adhan-voices";
import type { ReminderKey } from "../utils/reminder-key";
import { atTimeSentence, beforeSentence } from "../utils/summary";
import { ForwardChevron } from "./forward-chevron";

const ICON_SIZE = 18;

/** The glyph of what happens at the Prayer Time. */
export const AtTimeIcon = ({ atTime }: { atTime: ReminderRule["atTime"] }) => {
  switch (atTime) {
    case "off": {
      return <XIcon size={ICON_SIZE} />;
    }
    case "takbir": {
      return <AudioLinesIcon size={ICON_SIZE} />;
    }
    case "adhan": {
      return <MicIcon size={ICON_SIZE} />;
    }
    default: {
      return <BellIcon size={ICON_SIZE} />;
    }
  }
};

/** A Prayer Time's name and what its alerts will do; opens its sheet. */
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
  const { installed } = useAdhanVoices();

  return (
    <Item size="sm" testID={`reminder-row-${reminderKey}`} onPress={onPress}>
      <Item.Media variant="icon">
        <AtTimeIcon atTime={rule.atTime} />
      </Item.Media>
      <Item.Content>
        <Item.Title>{t(`names.${reminderKey}`)}</Item.Title>
        <Item.Description>
          {atTimeSentence(t, launchLanguage, reminderKey, rule, installed)}
        </Item.Description>
        <Item.Description>
          {beforeSentence(t, launchLanguage, rule)}
        </Item.Description>
      </Item.Content>
      <Item.Actions>
        <ForwardChevron />
      </Item.Actions>
    </Item>
  );
};
