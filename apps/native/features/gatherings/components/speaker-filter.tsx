import { localized } from "@alrisali/domain/gatherings";
import type { Speaker } from "@alrisali/domain/gatherings";
import { Chip } from "panelui-native";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

import { SpeakerAvatar } from "./speaker-avatar";

/** 'All' and each Speaker as a row of chips; one is chosen at a time. */
export const SpeakerFilter = ({
  speakers,
  selected,
  onSelect,
}: {
  speakers: readonly Speaker[];
  selected: string | null;
  onSelect: (speakerId: string | null) => void;
}) => {
  const { t } = useTranslation("gatherings");

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t("speakers.label")}
      contentContainerClassName="gap-2"
      className="grow-0"
    >
      <Chip
        size="lg"
        variant={selected === null ? "primary" : "outline"}
        selected={selected === null}
        onPress={() => onSelect(null)}
      >
        {t("speakers.all")}
      </Chip>
      {speakers.map((speaker) => (
        <Chip
          key={speaker.id}
          size="lg"
          variant={selected === speaker.id ? "primary" : "outline"}
          selected={selected === speaker.id}
          start={<SpeakerAvatar speaker={speaker} size="sm" />}
          onPress={() => onSelect(speaker.id)}
        >
          {localized(speaker.name, launchLanguage)}
        </Chip>
      ))}
    </ScrollView>
  );
};
