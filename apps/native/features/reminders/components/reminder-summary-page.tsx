import { alertTypeOf } from "@alrisali/domain/reminders";
import type { ReminderRule } from "@alrisali/domain/reminders";
import { Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

import type { useSoundPreview } from "../hooks/use-sound-preview";
import { minutesPhrase } from "../utils/minutes-phrase";
import type { ReminderKey } from "../utils/reminder-key";
import { previewIdOf, ruleSoundName, summarySentence } from "../utils/summary";
import { AlertTypeIcon } from "./alert-type-icon";
import { ForwardChevron } from "./forward-chevron";
import { SoundPreviewButton } from "./sound-preview-button";

export type ReminderPage = "root" | "alert" | "sound" | "timing";

/**
 * The sheet's first page: what the Reminder will do as one sentence, with a
 * play button for its sound, and the rows that open the Alert, Sound and
 * Timing pages.
 */
export const ReminderSummaryPage = ({
  reminderKey,
  rule,
  preview,
  onOpenPage,
}: {
  reminderKey: ReminderKey;
  rule: ReminderRule;
  preview: ReturnType<typeof useSoundPreview>;
  onOpenPage: (page: Exclude<ReminderPage, "root">) => void;
}) => {
  const { t } = useTranslation("reminders");
  const type = alertTypeOf(rule);
  const previewId = previewIdOf(rule);
  const hasSound = type === "tone" || type === "adhan";
  const soundName = ruleSoundName(t, rule);
  const timing =
    rule.minutesBefore === 0
      ? t("sheet.onTime")
      : t("sheet.beforeShort", {
          minutes: minutesPhrase(t, launchLanguage, rule.minutesBefore),
        });

  return (
    <View className="gap-4">
      <View
        className="bg-secondary flex-row items-center gap-3 rounded-2xl p-4"
        accessibilityRole="summary"
        accessibilityLiveRegion="polite"
      >
        <View
          className={`size-10 items-center justify-center rounded-full ${type === "off" ? "bg-muted" : "bg-primary"}`}
        >
          <AlertTypeIcon
            type={type}
            tone={type === "off" ? "muted-foreground" : "primary-foreground"}
          />
        </View>
        <View className="flex-1 gap-1">
          {type === "off" ? null : (
            <Text size="sm" muted>
              {t("sheet.willHear")}
            </Text>
          )}
          <Text size="xl" weight="semibold">
            {summarySentence(t, launchLanguage, reminderKey, rule)}
          </Text>
        </View>
        {previewId ? (
          <SoundPreviewButton
            soundName={soundName}
            playing={preview.playingId === previewId}
            onPress={() => preview.toggle(previewId)}
          />
        ) : null}
      </View>
      <Item.Group>
        <Item size="sm" onPress={() => onOpenPage("alert")}>
          <Item.Content>
            <Item.Title>{t("alertType.title")}</Item.Title>
          </Item.Content>
          <Item.Actions>
            <Text size="sm" muted>
              {t(`alertType.types.${type}`)}
            </Text>
            <ForwardChevron />
          </Item.Actions>
        </Item>
        <Item.Separator />
        <Item
          size="sm"
          disabled={!hasSound}
          onPress={() => onOpenPage("sound")}
        >
          <Item.Content>
            <Item.Title>{t("rule.sound")}</Item.Title>
          </Item.Content>
          <Item.Actions className="max-w-[65%] shrink">
            {hasSound ? (
              <Text size="sm" muted numberOfLines={1} className="shrink">
                {soundName}
              </Text>
            ) : null}
            <ForwardChevron />
          </Item.Actions>
        </Item>
        <Item.Separator />
        <Item
          size="sm"
          disabled={type === "off"}
          onPress={() => onOpenPage("timing")}
        >
          <Item.Content>
            <Item.Title>{t("sheet.timing")}</Item.Title>
          </Item.Content>
          <Item.Actions>
            {type === "off" ? null : (
              <Text size="sm" muted>
                {timing}
              </Text>
            )}
            <ForwardChevron />
          </Item.Actions>
        </Item>
      </Item.Group>
      {type === "adhan" && Platform.OS === "ios" ? (
        <Text size="sm" muted>
          {t("rule.adhanIosHint")}
        </Text>
      ) : null}
      {reminderKey === "imsak" ? (
        <Text size="sm" muted>
          {t("screen.imsakDescription")}
        </Text>
      ) : null}
    </View>
  );
};
