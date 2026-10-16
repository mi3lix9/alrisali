import {
  AT_TIME_ALERTS,
  findAdhanSound,
  IMSAK_AT_TIME_ALERTS,
  isFullAdhanAvailable,
  MAX_MINUTES_BEFORE,
  MAX_TAKBIR_SECONDS,
  SYSTEM_SOUND_ID,
} from "@alrisali/domain/reminders";
import type {
  AtTimeAlert,
  ImsakRule,
  ReminderRule,
} from "@alrisali/domain/reminders";
import {
  Alert,
  Button,
  Card,
  Item,
  NumberInput,
  Switch,
  Text,
  toast,
} from "panelui-native";
import { CheckIcon, PlayIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { formatNumber, parseNumber } from "@/shared/lib/numbers";
import { launchLanguage } from "@/shared/lib/preferences";

import { INSTALLED_ADHAN_SOUNDS } from "../data/adhan-catalogue";
import { stopAdhan } from "../utils/adhan-player";
import { testAtTimeAlert } from "../utils/test-alert";

/** The rule being edited; Imsak's also has its Ramadan choice. */
export type AlertDraft = ReminderRule & Partial<Pick<ImsakRule, "ramadanOnly">>;

const FULL_ADHAN_AVAILABLE = isFullAdhanAvailable(INSTALLED_ADHAN_SOUNDS);

/** One choice in a list: a radio row with a check when chosen. */
const Choice = ({
  testID,
  title,
  description,
  selected,
  disabled = false,
  onPress,
}: {
  testID: string;
  title: string;
  description?: string | undefined;
  selected: boolean;
  disabled?: boolean;
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
    <Item.Content>
      <Item.Title>{title}</Item.Title>
      {description ? <Item.Description>{description}</Item.Description> : null}
    </Item.Content>
    <Item.Actions>{selected ? <CheckIcon size={20} /> : null}</Item.Actions>
  </Item>
);

/**
 * What happens at the Prayer Time: off, silent, the takbir or the full
 * adhan. The full adhan is offered but disabled, with the reason, until an
 * adhan recording is installed; Imsak has none.
 */
export const AtTimeChoices = ({
  rule,
  imsak,
  onChange,
}: {
  rule: AlertDraft;
  imsak: boolean;
  onChange: (change: { atTime: AtTimeAlert }) => void;
}) => {
  const { t } = useTranslation("reminders");
  const kinds: readonly AtTimeAlert[] = imsak
    ? IMSAK_AT_TIME_ALERTS
    : AT_TIME_ALERTS;
  const describe = (kind: AtTimeAlert) => {
    if (kind !== "adhan") {
      return t(`atTime.${kind}.description`);
    }
    if (!FULL_ADHAN_AVAILABLE) {
      return t("editor.adhanUnavailable");
    }
    return Platform.OS === "ios"
      ? `${t("atTime.adhan.description")} · ${t("editor.adhanOnOpen")}`
      : t("atTime.adhan.description");
  };
  return (
    <>
      <Text weight="medium">{t("editor.atTimeSection")}</Text>
      <Item.Group>
        {kinds.map((kind) => (
          <Choice
            key={kind}
            testID={`adhan-editor-at-time-${kind}`}
            title={t(`atTime.${kind}.title`)}
            description={describe(kind)}
            selected={rule.atTime === kind}
            disabled={kind === "adhan" && !FULL_ADHAN_AVAILABLE}
            onPress={() => onChange({ atTime: kind })}
          />
        ))}
      </Item.Group>
      {(rule.atTime === "takbir" || rule.atTime === "adhan") &&
      Platform.OS === "ios" ? (
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
    </>
  );
};

/**
 * The voice the takbir and the full adhan come from: the system's sound, or
 * an installed catalogue voice.
 */
export const SoundChoices = ({
  rule,
  onChange,
}: {
  rule: AlertDraft;
  onChange: (adhanSound: string) => void;
}) => {
  const { t } = useTranslation("reminders");
  // A voice no longer installed plays the system's sound.
  const chosen = findAdhanSound(INSTALLED_ADHAN_SOUNDS, rule.adhanSound)
    ? rule.adhanSound
    : SYSTEM_SOUND_ID;
  const noRecordings = INSTALLED_ADHAN_SOUNDS.length === 0;
  return (
    <>
      <Text weight="medium">{t("editor.soundSection")}</Text>
      <Item.Group>
        <Choice
          testID={`adhan-editor-sound-${SYSTEM_SOUND_ID}`}
          title={t("editor.systemSound")}
          description={noRecordings ? t("editor.systemSoundHint") : undefined}
          selected={chosen === SYSTEM_SOUND_ID}
          onPress={() => onChange(SYSTEM_SOUND_ID)}
        />
        {INSTALLED_ADHAN_SOUNDS.map((sound) => (
          <Choice
            key={sound.id}
            testID={`adhan-editor-sound-${sound.id}`}
            title={sound.name[launchLanguage]}
            selected={chosen === sound.id}
            onPress={() => onChange(sound.id)}
          />
        ))}
      </Item.Group>
      {rule.atTime === "takbir" && !noRecordings ? (
        <Text muted size="xs">
          {t("editor.takbirFromVoice")}
        </Text>
      ) : null}
    </>
  );
};

/** The Reminder before the Prayer Time, and Imsak's Ramadan-only choice. */
export const BeforeReminderOptions = ({
  rule,
  name,
  imsak,
  onChange,
}: {
  rule: AlertDraft;
  name: string;
  imsak: boolean;
  onChange: (change: Partial<AlertDraft>) => void;
}) => {
  const { t } = useTranslation("reminders");
  return (
    <>
      <Text weight="medium">{t("editor.optionsSection")}</Text>
      <Item.Group>
        <Item size="sm">
          <Item.Content>
            <Item.Title>{t("editor.before")}</Item.Title>
            <Item.Description>{t("editor.beforeHint")}</Item.Description>
          </Item.Content>
          <Item.Actions>
            <Switch
              label={`${name}: ${t("editor.before")}`}
              value={rule.enabled}
              onValueChange={(enabled) => onChange({ enabled })}
            />
          </Item.Actions>
        </Item>
        {imsak ? (
          <>
            <Item.Separator />
            <Item size="sm">
              <Item.Content>
                <Item.Title>{t("editor.ramadanOnly")}</Item.Title>
                <Item.Description>
                  {t("editor.ramadanOnlyHint")}
                </Item.Description>
              </Item.Content>
              <Item.Actions>
                <Switch
                  label={`${name}: ${t("editor.ramadanOnly")}`}
                  value={rule.ramadanOnly ?? true}
                  onValueChange={(ramadanOnly) => onChange({ ramadanOnly })}
                />
              </Item.Actions>
            </Item>
          </>
        ) : null}
      </Item.Group>
      {rule.enabled ? (
        <NumberInput
          label={t("editor.minutesBefore")}
          value={rule.minutesBefore}
          formatValue={(minutes) => formatNumber(minutes)}
          parseValue={parseNumber}
          min={0}
          max={MAX_MINUTES_BEFORE}
          step={1}
          onValueChange={(minutesBefore) => {
            if (
              Number.isInteger(minutesBefore) &&
              minutesBefore !== rule.minutesBefore
            ) {
              onChange({ minutesBefore });
            }
          }}
        />
      ) : null}
    </>
  );
};

/** Tests the unsaved choice: the recording, or the system sound now. */
export const TestCard = ({
  rule,
  name,
  sounding,
}: {
  rule: AlertDraft;
  name: string;
  sounding: boolean;
}) => {
  const { t } = useTranslation("reminders");
  const [playing, setPlaying] = useState(false);

  const test = async () => {
    if (playing) {
      stopAdhan();
      setPlaying(false);
      return;
    }
    const outcome = await testAtTimeAlert(
      rule,
      t("editor.testNotification", { name }),
      () => setPlaying(false)
    );
    if (outcome === "playing") {
      setPlaying(true);
    } else if (outcome === "denied") {
      toast.show({ variant: "warning", label: t("editor.testDenied") });
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("editor.testTitle")}</Card.Title>
        <Card.Description>
          {sounding ? t("editor.testHint") : t("editor.testNoSound")}
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button
          size="sm"
          testID="adhan-editor-test"
          disabled={!sounding}
          onPress={() => {
            void test();
          }}
        >
          <PlayIcon size={16} />
          {playing ? t("editor.stop") : t("editor.test")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
