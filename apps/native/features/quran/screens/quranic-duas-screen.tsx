import "../i18n/duas";
import {
  filterQuranicDuas,
  QURANIC_DUAS,
  quranicDuaFacets,
} from "@alrisali/domain/quran";
import type {
  QuranicDuaSpeaker,
  QuranicDuaSubject,
} from "@alrisali/domain/quran";
import { Stack } from "expo-router";
import { Button, Chip, Text } from "panelui-native";
import { PlayIcon, XIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ScrollView, View } from "react-native";

import { DuaCard } from "../components/dua-card";
import {
  playQuranicDuas,
  stopQuranicDuas,
  useRecitingDua,
} from "../data/quranic-duas";
import { useDuaReciter } from "../hooks/use-dua-reciter";

interface ChipRowProps<Option extends string> {
  testID: string;
  options: readonly Option[];
  selected: Option | null;
  label: (option: Option) => string;
  onSelect: (option: Option | null) => void;
}

/** A row of single-choice chips with "All" first; choosing the chosen chip clears it. */
const ChipRow = <Option extends string>({
  testID,
  options,
  selected,
  label,
  onSelect,
}: ChipRowProps<Option>) => {
  const { t } = useTranslation("quranDuas");
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      className="grow-0"
      contentContainerClassName="gap-2"
    >
      <Chip
        size="lg"
        variant={selected === null ? "primary" : "outline"}
        selected={selected === null}
        onPress={() => onSelect(null)}
      >
        {t("all")}
      </Chip>
      {options.map((option) => (
        <Chip
          key={option}
          size="lg"
          variant={option === selected ? "primary" : "outline"}
          selected={option === selected}
          onPress={() => onSelect(option === selected ? null : option)}
        >
          {label(option)}
        </Chip>
      ))}
    </ScrollView>
  );
};

/**
 * The Quranic Duas: every supplication the Quran reports with its speaker and
 * subject, filtered by either, and played one after another from the top of
 * what the filters leave.
 */
export const QuranicDuasScreen = () => {
  const { t } = useTranslation("quranDuas");
  const reciter = useDuaReciter();
  const reciting = useRecitingDua();
  const [speaker, setSpeaker] = useState<QuranicDuaSpeaker | null>(null);
  const [subject, setSubject] = useState<QuranicDuaSubject | null>(null);

  const duas = filterQuranicDuas({ speaker, subject });
  // Each filter offers what the other leaves, so no choice empties the list.
  const { speakers } = quranicDuaFacets(
    filterQuranicDuas({ subject }, QURANIC_DUAS)
  );
  const { subjects } = quranicDuaFacets(
    filterQuranicDuas({ speaker }, QURANIC_DUAS)
  );

  const header = (
    <View className="gap-3 pb-1">
      <Text size="sm" muted>
        {t("description")}
      </Text>
      <Text weight="semibold">{t("speaker")}</Text>
      <ChipRow
        testID="dua-speakers"
        options={speakers}
        selected={speaker}
        label={(option) => t(`speakers.${option}`)}
        onSelect={setSpeaker}
      />
      <Text weight="semibold">{t("subject")}</Text>
      <ChipRow
        testID="dua-subjects"
        options={subjects}
        selected={subject}
        label={(option) => t(`subjects.${option}`)}
        onSelect={setSubject}
      />
      <View className="flex-row flex-wrap items-center gap-3">
        <Text testID="dua-count" muted>
          {t("count", { count: duas.length })}
        </Text>
        {reciting ? (
          <Button
            testID="dua-stop"
            variant="outline"
            startContent={<XIcon size={16} />}
            onPress={stopQuranicDuas}
          >
            {t("stop")}
          </Button>
        ) : (
          <Button
            testID="dua-play-all"
            accessibilityLabel={t("playAllLabel")}
            disabled={duas.length === 0}
            startContent={<PlayIcon size={18} />}
            onPress={() => playQuranicDuas(duas, reciter)}
          >
            {t("playAll")}
          </Button>
        )}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      <FlatList
        testID="quranic-duas"
        data={duas}
        keyExtractor={(dua) => dua.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text muted>{t("empty")}</Text>}
        renderItem={({ item }) => (
          <DuaCard
            dua={item}
            title={t(`speakers.${item.speaker}`)}
            description={t(`subjects.${item.subject}`)}
          />
        )}
      />
    </>
  );
};
