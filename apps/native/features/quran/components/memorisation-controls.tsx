import {
  AYAH_LENGTH_FACTORS,
  PLAYBACK_SPEEDS,
  REPEAT_COUNTS,
  SLEEP_TIMERS,
} from "@alrisali/domain/quran";
import {
  Item,
  Switch,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { PAUSE_SECONDS, repeatId, sleepId } from "../utils/memorisation-form";
import type { MemorisationForm } from "../utils/memorisation-form";

interface ChoiceProps {
  label: string;
  testID: string;
  options: readonly { id: string; text: string }[];
  value: string;
  onChange: (id: string) => void;
}

const Choice = ({ label, testID, options, value, onChange }: ChoiceProps) => (
  <View className="gap-2">
    <Text size="sm" muted>
      {label}
    </Text>
    <ToggleButtonGroup
      selectionMode="single"
      size="sm"
      accessibilityLabel={label}
      value={[value]}
      onValueChange={([next]) => {
        if (next && options.some((option) => option.id === next)) {
          onChange(next);
        }
      }}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.id}
          id={option.id}
          testID={`${testID}-${option.id}`}
        >
          {option.text}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  </View>
);

interface MemorisationControlsProps {
  form: MemorisationForm;
  onChange: (form: MemorisationForm) => void;
}

/**
 * Play To's memorisation choices: ayah and range repeat, the pause after each
 * ayah, speed, the sleep timer, and whether to ask at the end of the range.
 */
export const MemorisationControls = ({
  form,
  onChange,
}: MemorisationControlsProps) => {
  const { t } = useTranslation("quran");
  const set = (change: Partial<MemorisationForm>) =>
    onChange({ ...form, ...change });
  const repeats = REPEAT_COUNTS.map((count) => ({
    id: repeatId(count),
    text:
      count === "infinite"
        ? t("playTo.forever")
        : t("playTo.repeat", { times: formatNumber(count) }),
  }));

  return (
    <View className="gap-4">
      <Choice
        label={t("playTo.eachAyah")}
        testID="play-to-ayah-repeat"
        options={repeats}
        value={form.ayahRepeat}
        onChange={(ayahRepeat) => set({ ayahRepeat })}
      />
      <Choice
        label={t("playTo.wholeRange")}
        testID="play-to-range-repeat"
        options={repeats}
        value={form.rangeRepeat}
        onChange={(rangeRepeat) => set({ rangeRepeat })}
      />
      <Choice
        label={t("playTo.pauseTitle")}
        testID="play-to-pause"
        options={[
          { id: "none", text: t("playTo.pauseNone") },
          { id: "seconds", text: t("playTo.pauseSeconds") },
          { id: "ayahLength", text: t("playTo.pauseAyahLength") },
        ]}
        value={form.pause}
        onChange={(pause) => {
          if (
            pause === "none" ||
            pause === "seconds" ||
            pause === "ayahLength"
          ) {
            set({ pause });
          }
        }}
      />
      {form.pause === "seconds" ? (
        <Choice
          label={t("playTo.pauseSeconds")}
          testID="play-to-pause-seconds"
          options={PAUSE_SECONDS.map((seconds) => ({
            id: String(seconds),
            text: t("playTo.seconds", { seconds: formatNumber(seconds) }),
          }))}
          value={form.seconds}
          onChange={(seconds) => set({ seconds })}
        />
      ) : null}
      {form.pause === "ayahLength" ? (
        <Choice
          label={t("playTo.pauseAyahLength")}
          testID="play-to-pause-factor"
          options={AYAH_LENGTH_FACTORS.map((factor) => ({
            id: String(factor),
            text: t("playTo.ayahLengthFactor", {
              factor: formatNumber(factor),
            }),
          }))}
          value={form.factor}
          onChange={(factor) => set({ factor })}
        />
      ) : null}
      <Choice
        label={t("playTo.speedTitle")}
        testID="play-to-speed"
        options={PLAYBACK_SPEEDS.map((speed) => ({
          id: String(speed),
          text: t("playTo.speed", { speed: formatNumber(speed) }),
        }))}
        value={form.speed}
        onChange={(speed) => set({ speed })}
      />
      <Choice
        label={t("playTo.sleepTitle")}
        testID="play-to-sleep"
        options={SLEEP_TIMERS.map((sleep) => {
          let text = t("playTo.sleepOff");
          if (sleep.kind === "endOfSurah") {
            text = t("playTo.sleepEndOfSurah");
          } else if (sleep.kind === "minutes") {
            text = t("playTo.sleepMinutes", {
              minutes: formatNumber(sleep.minutes),
            });
          }
          return { id: sleepId(sleep), text };
        })}
        value={form.sleep}
        onChange={(sleep) => set({ sleep })}
      />
      <Item>
        <Item.Content>
          <Item.Title>{t("playTo.askAtEnd")}</Item.Title>
          <Item.Description>{t("playTo.askAtEndHint")}</Item.Description>
        </Item.Content>
        <Item.Actions>
          <Switch
            label={t("playTo.askAtEnd")}
            value={form.askToContinueAtEnd}
            onValueChange={(askToContinueAtEnd) => set({ askToContinueAtEnd })}
          />
        </Item.Actions>
      </Item>
    </View>
  );
};
