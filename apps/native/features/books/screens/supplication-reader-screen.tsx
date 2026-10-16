import "../i18n";
import {
  countersOf,
  getSupplication,
  loadSupplicationText,
} from "@alrisali/content/books";
import type { Passage } from "@alrisali/content/books";
import {
  DEFAULT_AUTO_SCROLL_SPEED,
  resumeSection,
  tapCounter,
} from "@alrisali/domain/books";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { Spinner, Text, ToggleButton, ToggleButtonGroup } from "panelui-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

import { AutoScrollBar } from "../components/auto-scroll-bar";
import { FormatSheet } from "../components/format-sheet";
import { PassageCounter } from "../components/passage-counter";
import { PassageView } from "../components/passage-view";
import { ReaderToolbar } from "../components/reader-toolbar";
import { ResumeBanner } from "../components/resume-banner";
import { useSavedSupplicationPosition } from "../data/supplication-positions";
import { useAutoScroll } from "../hooks/use-auto-scroll";
import { useReaderFontFamily } from "../hooks/use-reader-fonts";
import {
  READER_LANGUAGES,
  useReaderPreferences,
} from "../hooks/use-reader-preferences";
import { useSectionSaver } from "../hooks/use-section-saver";
import { READER_THEME_COLORS } from "../utils/reader-theme";

/** A section counts as reached once half of it is on screen. */
const VIEWABILITY = { itemVisiblePercentThreshold: 50 };
/** How many words of the text's opening the format sheet sets as its sample. */
const SAMPLE_WORDS = 12;

/** What the route hands the reader to show a text as Recite-Along. */
export interface ReciteAlongSlotProps {
  /** The Arabic text; blank lines separate passages. */
  text: string;
  fontSize: number;
  header?: ReactElement;
}

const LanguageControl = () => {
  const { t } = useTranslation("books");
  const { language, setLanguage } = useReaderPreferences();

  return (
    <View className="pb-2">
      <ToggleButtonGroup
        selectionMode="single"
        size="sm"
        className="w-full"
        accessibilityLabel={t("reader.language.label")}
        value={[language]}
        onValueChange={([next]) => {
          const selected = READER_LANGUAGES.find(
            (candidate) => candidate === next
          );
          if (selected) {
            setLanguage(selected);
          }
        }}
      >
        {READER_LANGUAGES.map((option) => (
          <ToggleButton key={option} id={option}>
            {t(`reader.language.${option}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </View>
  );
};

/**
 * The text, section by section, in the Believer's format. It offers to
 * continue at the saved section and saves the section reached, once the
 * Believer moves through the text, so opening it alone never loses a place.
 */
const SupplicationText = ({
  supplicationId,
  passages,
  savedSection,
  autoScroll,
  continueAtOpen,
}: {
  supplicationId: string;
  passages: readonly Passage[];
  savedSection: number | null;
  /** Scrolls the text down by itself while `active`, pausing on touch. */
  autoScroll: { active: boolean; speed: number; onFinish: () => void };
  /** Opened from a Continue card: go to the saved section without asking. */
  continueAtOpen: boolean;
}) => {
  const { language, font, fontSize, spacing, theme } = useReaderPreferences();
  const format = { font, fontSize, spacing, theme };
  const fontFamily = useReaderFontFamily()(font);
  const colors = theme === "system" ? undefined : READER_THEME_COLORS[theme];
  const report = useSectionSaver(supplicationId);
  const listRef = useRef<FlatList<Passage>>(null);
  const movedRef = useRef(false);
  const scrollProps = useAutoScroll({ listRef, ...autoScroll });
  const counters = useMemo(() => countersOf(supplicationId), [supplicationId]);
  const [counts, setCounts] = useState<ReadonlyMap<number, number>>(new Map());
  const reportRef = useRef(report);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);
  // Fixed when the text opens: saving as the Believer reads must not move it.
  const [resume, setResume] = useState<{
    section: number | null;
    status: "offered" | "resumed" | "dismissed";
  }>(() => {
    const section = resumeSection(savedSection, passages.length);
    return {
      section,
      status: continueAtOpen && section !== null ? "resumed" : "offered",
    };
  });
  const offer = resume.section;
  const resumed = resume.status === "resumed";

  // FlatList wants the same callback for its whole life.
  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: { index?: number | undefined; isViewable: boolean }[];
    }) => {
      const first = viewableItems.find((token) => token.isViewable)?.index;
      if (movedRef.current && typeof first === "number") {
        reportRef.current(first);
      }
    },
    []
  );

  const goTo = (index: number) => {
    movedRef.current = true;
    report(index);
    if (index === 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } else {
      listRef.current?.scrollToIndex({ index, animated: true });
    }
  };

  // Opened from a Continue card: scroll to the saved section once the list
  // has laid out, once.
  const pendingContinue = useRef(resume.status === "resumed");
  const continueOnLayout = () => {
    if (pendingContinue.current && offer !== null) {
      pendingContinue.current = false;
      goTo(offer);
    }
  };

  return (
    <FlatList
      ref={listRef}
      testID="books-reader-text"
      className={`flex-1 ${colors ? "" : "bg-background"}`}
      style={colors && { backgroundColor: colors.background }}
      contentContainerClassName="p-4 pb-8"
      contentInsetAdjustmentBehavior="automatic"
      data={passages}
      keyExtractor={(_, index) => String(index)}
      extraData={`${language}-${font}-${fontSize}-${spacing}-${theme}-${fontFamily}-${resumed}-${[...counts.values()].join(",")}`}
      ListHeaderComponent={
        <View>
          <LanguageControl />
          {offer !== null && resume.status !== "dismissed" ? (
            <ResumeBanner
              section={offer}
              total={passages.length}
              resumed={resumed}
              onResume={() => {
                setResume({ section: offer, status: "resumed" });
                goTo(offer);
              }}
              onRestart={() => {
                setResume({ section: offer, status: "dismissed" });
                goTo(0);
              }}
            />
          ) : null}
        </View>
      }
      {...scrollProps}
      viewabilityConfig={VIEWABILITY}
      onViewableItemsChanged={onViewableItemsChanged}
      onContentSizeChange={continueOnLayout}
      onScrollBeginDrag={() => {
        movedRef.current = true;
      }}
      onScrollToIndexFailed={({ index, averageItemLength }) => {
        // Sections not laid out yet: jump near, then to the section itself.
        listRef.current?.scrollToOffset({
          offset: averageItemLength * index,
          animated: false,
        });
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index, animated: true });
        }, 100);
      }}
      renderItem={({ item, index }) => {
        const counter = counters.get(index);
        return (
          <PassageView
            passage={item}
            language={language}
            format={format}
            fontFamily={fontFamily}
            colors={colors}
            number={index + 1}
            highlighted={resumed && index === offer}
            counter={
              counter ? (
                <PassageCounter
                  count={counts.get(index) ?? 0}
                  target={counter.target}
                  colors={colors}
                  onTap={() =>
                    setCounts((current) =>
                      new Map(current).set(
                        index,
                        tapCounter(current.get(index) ?? 0)
                      )
                    )
                  }
                  onReset={() =>
                    setCounts((current) => new Map(current).set(index, 0))
                  }
                />
              ) : undefined
            }
          />
        );
      }}
    />
  );
};

/** The opening words of the text's first Arabic passage. */
const sampleOf = (passages: readonly Passage[] | undefined) => {
  const words = passages
    ?.find((passage) => passage.ar.length > 0)
    ?.ar.split(/\s+/u);
  if (!words) {
    return;
  }
  return words.length > SAMPLE_WORDS
    ? `${words.slice(0, SAMPLE_WORDS).join(" ")}…`
    : words.join(" ");
};

/**
 * Reads one Supplication in Arabic, English or both, in the Believer's format,
 * or its Arabic as Recite-Along when the route provides it. It remembers the
 * section reached and offers to continue there. A bottom toolbar holds Format,
 * Recite-Along and the route's `toolbarActions` for the Supplication.
 */
export const SupplicationReaderScreen = ({
  reciteAlong: ReciteAlong,
  toolbarActions,
}: {
  reciteAlong?: ComponentType<ReciteAlongSlotProps>;
  toolbarActions?: (supplicationId: string) => ReactNode;
}) => {
  const { t } = useTranslation("books");
  const { id, resume } = useLocalSearchParams<{
    id: string;
    resume?: string;
  }>();
  const supplication = getSupplication(id);
  const { fontSize } = useReaderPreferences();
  const [reciting, setReciting] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_AUTO_SCROLL_SPEED);
  const stopAutoScroll = useCallback(() => setAutoScrolling(false), []);
  const text = useQuery({
    queryKey: ["books", "supplication-text", id],
    queryFn: () => loadSupplicationText(id),
    enabled: supplication !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const saved = useSavedSupplicationPosition(id);

  if (!supplication) {
    return (
      <Screen>
        <Text muted>{t("notFound")}</Text>
      </Screen>
    );
  }

  const ready = text.data !== undefined && !saved.isPending;
  let content: ReactNode = (
    <View className="bg-background flex-1 p-4">
      {text.isError ? (
        <Text muted>{t("reader.loadError")}</Text>
      ) : (
        <Spinner label={t("reader.loading")} />
      )}
    </View>
  );
  if (ReciteAlong && reciting && text.data) {
    content = (
      <ReciteAlong
        text={text.data
          .map((passage) => passage.ar)
          .filter((arabic) => arabic.length > 0)
          .join("\n\n")}
        fontSize={fontSize}
      />
    );
  } else if (ready) {
    content = (
      <SupplicationText
        supplicationId={supplication.id}
        passages={text.data}
        savedSection={saved.data?.section ?? null}
        autoScroll={{
          active: autoScrolling,
          speed,
          onFinish: stopAutoScroll,
        }}
        continueAtOpen={resume === "1"}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: supplication.title[launchLanguage],
          headerLargeTitle: false,
        }}
      />
      <View className="bg-background flex-1">
        {content}
        {autoScrolling && !reciting ? (
          <AutoScrollBar speed={speed} onSpeed={setSpeed} />
        ) : null}
        <ReaderToolbar
          reciting={reciting}
          autoScrolling={autoScrolling && !reciting}
          onToggleAutoScroll={
            reciting ? undefined : () => setAutoScrolling((current) => !current)
          }
          onFormat={() => setFormatOpen(true)}
          onToggleRecite={
            ReciteAlong ? () => setReciting((current) => !current) : undefined
          }
          actions={toolbarActions?.(supplication.id)}
        />
      </View>
      <FormatSheet
        open={formatOpen}
        sample={sampleOf(text.data)}
        onClose={() => setFormatOpen(false)}
      />
    </>
  );
};
