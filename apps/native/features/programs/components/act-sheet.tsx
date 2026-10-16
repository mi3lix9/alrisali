import "../i18n";
import type { Act } from "@alrisali/domain/programs";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Badge, BottomSheet, Button, Direction, Text } from "panelui-native";
import { PauseIcon, PlayIcon } from "panelui-native/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { joinParts } from "@/shared/lib/i18n";
import { launchLanguage } from "@/shared/lib/preferences";

import { useDescribe } from "../hooks/use-describe";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <View className="gap-1">
    <Text weight="semibold" accessibilityRole="header">
      {title}
    </Text>
    {children}
  </View>
);

/** Plays a dua's recording; unmounting the sheet stops it. */
const DuaAudio = ({ url }: { url: string }) => {
  const { t } = useTranslation("programs");
  const player = useAudioPlayer(url);
  const { playing, didJustFinish } = useAudioPlayerStatus(player);

  return (
    <Button
      variant="outline"
      startContent={playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
      onPress={() => {
        if (playing) {
          player.pause();
          return;
        }
        if (didJustFinish) {
          void player.seekTo(0);
        }
        player.play();
      }}
    >
      {playing ? t("sheet.pause") : t("sheet.listen")}
    </Button>
  );
};

const DuaDetail = ({
  detail,
}: {
  detail: Extract<Act["detail"], { type: "dua" }>;
}) => {
  const { t } = useTranslation("programs");
  const instructions = detail.instructions[launchLanguage];
  return (
    <>
      <Direction dir="rtl">
        <Text
          selectable
          accessibilityLanguage="ar"
          size="xl"
          style={{ lineHeight: 40 }}
        >
          {detail.arabic}
        </Text>
      </Direction>
      {detail.audioUrl ? <DuaAudio url={detail.audioUrl} /> : null}
      {detail.transliteration ? (
        <Section title={t("sheet.transliteration")}>
          <Text selectable>{detail.transliteration}</Text>
        </Section>
      ) : null}
      {/* The translation is English; Arabic readers read the dua as written. */}
      {launchLanguage === "en" && detail.translation ? (
        <Section title={t("sheet.translation")}>
          <Text selectable>{detail.translation}</Text>
        </Section>
      ) : null}
      {instructions ? (
        <Section title={t("sheet.instructions")}>
          <Text selectable>{instructions}</Text>
        </Section>
      ) : null}
    </>
  );
};

const PrayerDetail = ({
  detail,
}: {
  detail: Extract<Act["detail"], { type: "prayer" }>;
}) => {
  const { t } = useTranslation("programs");
  const steps = detail.steps[launchLanguage];
  const adhkar = detail.adhkar[launchLanguage];
  return (
    <>
      <View className="flex-row flex-wrap gap-2">
        <Badge variant="secondary">
          {t("rakahs", { count: detail.rakahs })}
        </Badge>
        <Badge variant={detail.requiresWudu ? "warning" : "outline"}>
          {detail.requiresWudu ? t("sheet.wudu") : t("sheet.noWudu")}
        </Badge>
      </View>
      {steps ? (
        <Section title={t("sheet.steps")}>
          <Text selectable>{steps}</Text>
        </Section>
      ) : null}
      {adhkar ? (
        <Section title={t("sheet.adhkar")}>
          <Text selectable>{adhkar}</Text>
        </Section>
      ) : null}
    </>
  );
};

/**
 * An Act's sheet: when it is done, its description and, by its type, the
 * dua to read or the prayer to perform.
 */
export const ActSheet = ({
  act,
  onClose,
}: {
  act: Act | null;
  onClose: () => void;
}) => {
  const describe = useDescribe();
  const description = act?.description[launchLanguage];

  return (
    <BottomSheet
      open={act !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <BottomSheet.Content>
        <BottomSheet.Header title={act?.name[launchLanguage] ?? ""} />
        <BottomSheet.Body>
          {act ? (
            <View className="gap-4 pb-4">
              <Text muted size="sm">
                {joinParts(
                  [describe.timing(act), describe.schedule(act)].filter(
                    (part): part is string => part !== null
                  )
                )}
              </Text>
              {description ? <Text selectable>{description}</Text> : null}
              {act.detail.type === "dua" ? (
                <DuaDetail detail={act.detail} />
              ) : null}
              {act.detail.type === "prayer" ? (
                <PrayerDetail detail={act.detail} />
              ) : null}
            </View>
          ) : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
