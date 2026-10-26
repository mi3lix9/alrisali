import type { ReminderRule } from "@alrisali/domain/reminders";
import { MAX_TAKBIR_SECONDS } from "@alrisali/domain/shared";
import { Alert, Item, Text, toast } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";
import { launchLanguage } from "@/shared/lib/preferences";

import { useAdhanVoices } from "../hooks/use-adhan-voices";
import type { SoundPreview } from "../hooks/use-sound-preview";
import type { ReminderKey } from "../utils/reminder-key";
import {
  atTimeSentence,
  beforeSentence,
  beforeValue,
  chosenVoice,
} from "../utils/summary";
import { testAtTimeAlert } from "../utils/test-alert";
import { ForwardChevron } from "./forward-chevron";
import { AtTimeIcon } from "./reminder-row";
import { SoundPreviewButton } from "./sound-preview-button";

export type ReminderPage = "root" | "atTime" | "voice" | "before";

const AT_TIME_PREVIEW = "at-time";

/**
 * The sheet's first page: what the alerts will do as sentences, with a play
 * button for the At-Time sound (the recording, or the system sound as a
 * notification now), and the rows that open the At-Time, Voice and Before
 * pages.
 */
export const ReminderSummaryPage = ({
  reminderKey,
  rule,
  needsPermission,
  preview,
  onOpenPage,
}: {
  reminderKey: ReminderKey;
  rule: ReminderRule;
  /** Notifications are off and could be asked for. */
  needsPermission: boolean;
  preview: SoundPreview;
  onOpenPage: (page: Exclude<ReminderPage, "root">) => void;
}) => {
  const { t } = useTranslation("reminders");
  const { installed } = useAdhanVoices();
  const name = t(`names.${reminderKey}`);
  const sounding = rule.atTime === "takbir" || rule.atTime === "adhan";
  const voice = chosenVoice(rule, installed);
  const playing = preview.playingId === AT_TIME_PREVIEW;

  const play = async () => {
    if (playing) {
      preview.stop();
      return;
    }
    const outcome = await testAtTimeAlert(
      rule,
      installed,
      t("editor.testNotification", { name }),
      () => preview.mark(null)
    );
    if (outcome === "playing") {
      preview.mark(AT_TIME_PREVIEW);
    } else if (outcome === "denied") {
      toast.show({ variant: "warning", label: t("editor.testDenied") });
    }
  };

  return (
    <View className="gap-4">
      <View
        className="bg-secondary flex-row items-center gap-3 rounded-2xl p-4"
        accessibilityRole="summary"
        accessibilityLiveRegion="polite"
      >
        <View
          className={`size-10 items-center justify-center rounded-full ${rule.atTime === "off" ? "bg-muted" : "bg-primary"}`}
        >
          <AtTimeIcon atTime={rule.atTime} />
        </View>
        <View className="flex-1 gap-1">
          <Text size="xl" weight="semibold">
            {atTimeSentence(t, launchLanguage, reminderKey, rule, installed)}
          </Text>
          <Text size="sm" muted>
            {beforeSentence(t, launchLanguage, rule)}
          </Text>
        </View>
        {sounding ? (
          <SoundPreviewButton
            testID="reminder-sheet-preview"
            soundName={t(`atTime.${rule.atTime}.title`)}
            playing={playing}
            onPress={() => {
              void play();
            }}
          />
        ) : null}
      </View>
      {needsPermission && (rule.atTime !== "off" || rule.enabled) ? (
        <Alert variant="info" testID="adhan-editor-permission-reason">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("editor.permissionTitle")}</Alert.Title>
            <Alert.Description>
              {t("editor.permissionReason")}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <Item.Group>
        <Item
          size="sm"
          testID="reminder-sheet-at-time"
          onPress={() => onOpenPage("atTime")}
        >
          <Item.Content>
            <Item.Title>{t("sheet.atTime")}</Item.Title>
          </Item.Content>
          <Item.Actions>
            <Text size="sm" muted>
              {t(`atTime.${rule.atTime}.title`)}
            </Text>
            <ForwardChevron />
          </Item.Actions>
        </Item>
        <Item.Separator />
        <Item
          size="sm"
          testID="reminder-sheet-voice"
          disabled={!sounding}
          onPress={() => onOpenPage("voice")}
        >
          <Item.Content>
            <Item.Title>{t("sheet.voice")}</Item.Title>
          </Item.Content>
          <Item.Actions className="max-w-[65%] shrink">
            {sounding ? (
              <Text size="sm" muted numberOfLines={1} className="shrink">
                {voice ? voice.name[launchLanguage] : t("editor.systemSound")}
              </Text>
            ) : null}
            <ForwardChevron />
          </Item.Actions>
        </Item>
        <Item.Separator />
        <Item
          size="sm"
          testID="reminder-sheet-before"
          onPress={() => onOpenPage("before")}
        >
          <Item.Content>
            <Item.Title>{t("sheet.before")}</Item.Title>
          </Item.Content>
          <Item.Actions>
            <Text size="sm" muted>
              {beforeValue(t, launchLanguage, rule)}
            </Text>
            <ForwardChevron />
          </Item.Actions>
        </Item>
      </Item.Group>
      {sounding && Platform.OS === "ios" ? (
        <Alert variant="info">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {t("editor.iosLimit", {
                seconds: formatNumber(MAX_TAKBIR_SECONDS),
              })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </View>
  );
};
