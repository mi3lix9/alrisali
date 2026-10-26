import {
  ADHAN_FORMS,
  MUEZZINS,
  REMINDER_SOUNDS,
  alertTypeOf,
} from "@alrisali/domain/reminders";
import type { AdhanId, ReminderRule } from "@alrisali/domain/reminders";
import { Item, Text } from "panelui-native";
import { CheckIcon } from "panelui-native/icons";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { useCSSVariable } from "uniwind";

import { localizeDigits } from "@/shared/lib/numbers";

import type { useSoundPreview } from "../hooks/use-sound-preview";
import { ADHAN_SECONDS } from "../utils/sound-files";
import type { PreviewSoundId } from "../utils/sound-files";
import { adhanName, toneName } from "../utils/summary";
import { SoundPreviewButton } from "./sound-preview-button";

const SECONDS_PER_MINUTE = 60;

const formatDuration = (seconds: number): string => {
  const whole = Math.round(seconds);
  const rest = String(whole % SECONDS_PER_MINUTE).padStart(2, "0");
  return localizeDigits(`${Math.floor(whole / SECONDS_PER_MINUTE)}:${rest}`);
};

/** A thin bar showing how far a preview has played. */
const ProgressBar = ({ progress }: { progress: number }) => (
  <View className="bg-muted mt-1.5 h-1 overflow-hidden rounded-full">
    <View
      className="bg-primary h-full rounded-full"
      style={{ width: `${Math.round(progress * 100)}%` }}
    />
  </View>
);

const Tick = ({ chosen }: { chosen: boolean }) => {
  const color = useCSSVariable("--color-primary");
  return chosen ? (
    <CheckIcon size={18} {...(typeof color === "string" ? { color } : {})} />
  ) : (
    <View className="size-[18px]" />
  );
};

/**
 * Picks the sound: the tones when the alert is a tone, the Adhan recordings
 * grouped by muezzin when it is an Adhan. Every sound that has a file can be
 * previewed.
 */
export const SoundPage = ({
  rule,
  onChange,
  preview,
}: {
  rule: ReminderRule;
  onChange: (change: Partial<ReminderRule>) => void;
  preview: ReturnType<typeof useSoundPreview>;
}) => {
  const { t } = useTranslation("reminders");

  const previewButton = (id: PreviewSoundId, name: string) => (
    <SoundPreviewButton
      soundName={name}
      playing={preview.playingId === id}
      onPress={() => preview.toggle(id)}
    />
  );

  if (alertTypeOf(rule) === "adhan") {
    return (
      <View className="gap-4">
        {MUEZZINS.map((muezzin) => (
          <View key={muezzin} className="gap-1">
            <Text size="sm" weight="medium" muted className="px-3">
              {t(`rule.muezzins.${muezzin}`)}
            </Text>
            <Item.Group>
              {ADHAN_FORMS.map((form, index) => {
                const id: AdhanId = `${muezzin}-${form}`;
                const name = adhanName(t, id);
                const playing = preview.playingId === id;
                return (
                  <Fragment key={id}>
                    {index > 0 ? <Item.Separator /> : null}
                    <Item size="sm" onPress={() => onChange({ adhan: id })}>
                      <Item.Content>
                        <Item.Title>{t(`rule.adhanForms.${form}`)}</Item.Title>
                        <Item.Description>
                          {formatDuration(ADHAN_SECONDS[id])}
                        </Item.Description>
                        {playing ? (
                          <ProgressBar progress={preview.progress} />
                        ) : null}
                      </Item.Content>
                      <Item.Actions>
                        {previewButton(id, name)}
                        <Tick chosen={rule.adhan === id} />
                      </Item.Actions>
                    </Item>
                  </Fragment>
                );
              })}
            </Item.Group>
          </View>
        ))}
        {Platform.OS === "ios" ? (
          <Text size="sm" muted>
            {t("rule.adhanIosHint")}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <Item.Group>
      {REMINDER_SOUNDS.map((sound, index) => {
        const name = toneName(t, sound);
        return (
          <Fragment key={sound}>
            {index > 0 ? <Item.Separator /> : null}
            <Item size="sm" onPress={() => onChange({ sound })}>
              <Item.Content>
                <Item.Title>{name}</Item.Title>
              </Item.Content>
              <Item.Actions>
                {sound === "default" ? null : previewButton(sound, name)}
                <Tick chosen={rule.sound === sound} />
              </Item.Actions>
            </Item>
          </Fragment>
        );
      })}
    </Item.Group>
  );
};
