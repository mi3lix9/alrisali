import { MAX_MINUTES_BEFORE } from "@alrisali/domain/reminders";
import type { ReminderRule } from "@alrisali/domain/reminders";
import { Chip, Item, Slider, Switch, Text } from "panelui-native";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";
import { launchLanguage } from "@/shared/lib/preferences";

import type { SoundPreview } from "../hooks/use-sound-preview";
import { playTone } from "../utils/adhan-player";
import { minutesPhrase } from "../utils/notification-request";
import type { BeforeTone } from "../utils/summary";
import { BEFORE_TONES, beforeToneChange, beforeToneOf } from "../utils/summary";
import { TONE_SOURCES } from "../utils/tone-sources";
import { Choice } from "./choice";
import { SoundPreviewButton } from "./sound-preview-button";

const PRESETS = [0, 5, 10, 15, 30] as const;
const TICKS = [0, 15, 30, 45, 60] as const;

const previewable = (tone: BeforeTone): tone is keyof typeof TONE_SOURCES =>
  tone in TONE_SOURCES;

/**
 * The Reminder before the Prayer Time, separate from the At-Time Alert: on or
 * off, how long before (a slider and presets) and its tone, each tone with a
 * play button.
 */
export const BeforePage = ({
  name,
  rule,
  preview,
  onChange,
}: {
  name: string;
  rule: ReminderRule;
  preview: SoundPreview;
  onChange: (change: Partial<ReminderRule>) => void;
}) => {
  const { t } = useTranslation("reminders");
  // The number follows the thumb while dragging; the rule saves on release.
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = dragging ?? rule.minutesBefore;
  const chosen = beforeToneOf(rule);

  const save = (minutesBefore: number) => {
    setDragging(null);
    if (minutesBefore !== rule.minutesBefore) {
      onChange({ minutesBefore });
    }
  };

  return (
    <View className="gap-4">
      <Item.Group>
        <Item size="sm">
          <Item.Content>
            <Item.Title>{t("sheet.before")}</Item.Title>
            <Item.Description>{t("editor.beforeHint")}</Item.Description>
          </Item.Content>
          <Item.Actions>
            <Switch
              label={`${name}: ${t("sheet.before")}`}
              value={rule.enabled}
              onValueChange={(enabled) => onChange({ enabled })}
            />
          </Item.Actions>
        </Item>
      </Item.Group>
      {rule.enabled ? (
        <>
          <View className="gap-3">
            <View
              className="items-center gap-1 py-2"
              accessibilityLiveRegion="polite"
            >
              <Text size="3xl" weight="bold">
                {formatNumber(shown)}
              </Text>
              <Text muted>{t("editor.minutesBefore")}</Text>
            </View>
            <Slider
              label={t("editor.minutesBefore")}
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
          <Item.Group>
            {BEFORE_TONES.map((tone, index) => (
              <Fragment key={tone}>
                {index > 0 ? <Item.Separator /> : null}
                <Choice
                  testID={`reminder-tone-${tone}`}
                  title={t(`tones.${tone}.title`)}
                  description={t(`tones.${tone}.hint`)}
                  selected={chosen === tone}
                  end={
                    previewable(tone) ? (
                      <SoundPreviewButton
                        soundName={t(`tones.${tone}.title`)}
                        playing={preview.playingId === tone}
                        onPress={() =>
                          preview.toggle(tone, (onEnd) => {
                            playTone(TONE_SOURCES[tone], onEnd);
                            return true;
                          })
                        }
                      />
                    ) : null
                  }
                  onPress={() => onChange(beforeToneChange(tone))}
                />
              </Fragment>
            ))}
          </Item.Group>
        </>
      ) : null}
    </View>
  );
};
