import {
  selectableAdhanSound,
  SYSTEM_SOUND_ID,
} from "@alrisali/domain/reminders";
import type { ReminderRule } from "@alrisali/domain/reminders";
import { adhanFileName } from "@alrisali/domain/shared";
import { Item, Text } from "panelui-native";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { useAdhanVoices } from "../hooks/use-adhan-voices";
import type { SoundPreview } from "../hooks/use-sound-preview";
import { playAdhan } from "../utils/adhan-player";
import { AdhanVoiceRow } from "./adhan-voice-row";
import { Choice } from "./choice";

/**
 * The adhan voice the takbir and the full adhan come from: the system's
 * sound, or a catalogue voice once downloaded, with its download beside it
 * and a play button for its takbir.
 */
export const VoicePage = ({
  rule,
  preview,
  onChange,
}: {
  rule: ReminderRule;
  preview: SoundPreview;
  onChange: (change: { adhanSound: string }) => void;
}) => {
  const { t } = useTranslation("reminders");
  const { catalogue, installed } = useAdhanVoices();
  // A voice not on the device plays the system's sound.
  const chosen = selectableAdhanSound(rule.adhanSound, installed);
  return (
    <>
      <Item.Group>
        <Choice
          testID={`adhan-editor-sound-${SYSTEM_SOUND_ID}`}
          title={t("editor.systemSound")}
          description={
            catalogue.length === 0 ? t("editor.systemSoundHint") : undefined
          }
          selected={chosen === SYSTEM_SOUND_ID}
          onPress={() => onChange({ adhanSound: SYSTEM_SOUND_ID })}
        />
        {catalogue.map((entry) => (
          <Fragment key={entry.id}>
            <Item.Separator />
            <AdhanVoiceRow
              entry={entry}
              selected={chosen === entry.id}
              playing={preview.playingId === entry.id}
              onSelect={() => onChange({ adhanSound: entry.id })}
              onPreview={() =>
                preview.toggle(entry.id, (onEnd) =>
                  playAdhan(adhanFileName(entry, "takbir"), onEnd)
                )
              }
            />
          </Fragment>
        ))}
      </Item.Group>
      {rule.atTime === "takbir" && installed.length > 0 ? (
        <Text muted size="xs">
          {t("editor.takbirFromVoice")}
        </Text>
      ) : null}
    </>
  );
};
