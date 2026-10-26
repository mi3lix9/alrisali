import { MAX_MINUTES_BEFORE } from "@alrisali/domain/reminders";
import type { ReminderRule } from "@alrisali/domain/reminders";
import { Chip, Slider, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";
import { launchLanguage } from "@/shared/lib/preferences";

import { minutesPhrase } from "../utils/minutes-phrase";
import type { ReminderKey } from "../utils/reminder-key";
import { timingSentence } from "../utils/summary";

const PRESETS = [0, 5, 10, 15, 30] as const;
const TICKS = [0, 15, 30, 45, 60] as const;

/** How long before the Prayer Time: a big number, a slider and presets. */
export const TimingPage = ({
  reminderKey,
  rule,
  onChange,
}: {
  reminderKey: ReminderKey;
  rule: ReminderRule;
  onChange: (change: Partial<ReminderRule>) => void;
}) => {
  const { t } = useTranslation("reminders");
  // The number follows the thumb while dragging; the rule saves on release.
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = dragging ?? rule.minutesBefore;

  const save = (minutesBefore: number) => {
    setDragging(null);
    if (minutesBefore !== rule.minutesBefore) {
      onChange({ minutesBefore });
    }
  };

  return (
    <View className="gap-6">
      <View
        className="items-center gap-1 py-2"
        accessibilityLiveRegion="polite"
      >
        <Text size="3xl" weight="bold">
          {formatNumber(shown)}
        </Text>
        <Text muted>
          {timingSentence(t, launchLanguage, reminderKey, shown)}
        </Text>
      </View>
      <View className="gap-1">
        <Slider
          label={t("rule.minutesBefore")}
          min={0}
          max={MAX_MINUTES_BEFORE}
          step={1}
          value={shown}
          formatValue={formatNumber}
          onValueChange={setDragging}
          onValueCommit={save}
        />
        <View className="flex-row justify-between px-1">
          {TICKS.map((tick) => (
            <Text key={tick} size="xs" muted>
              {formatNumber(tick)}
            </Text>
          ))}
        </View>
      </View>
      <View className="flex-row flex-wrap justify-center gap-2">
        {PRESETS.map((minutes) => (
          <Chip
            key={minutes}
            size="lg"
            selected={rule.minutesBefore === minutes}
            onPress={() => save(minutes)}
          >
            {minutes === 0
              ? t("sheet.onTime")
              : minutesPhrase(t, launchLanguage, minutes)}
          </Chip>
        ))}
      </View>
    </View>
  );
};
