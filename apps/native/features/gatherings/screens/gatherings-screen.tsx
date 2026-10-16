import "../i18n";
import {
  GATHERING_VIEWS,
  upcomingGatherings,
  visibleGatherings,
} from "@alrisali/domain/gatherings";
import type { GatheringView } from "@alrisali/domain/gatherings";
import { Stack } from "expo-router";
import { Spinner, ToggleButton, ToggleButtonGroup } from "panelui-native";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import { Screen } from "@/shared/ui/screen";

import { DayView } from "../components/day-view";
import { EmptyNotice } from "../components/empty-notice";
import { ListView } from "../components/list-view";
import { MapView } from "../components/map-view";
import { MonthView } from "../components/month-view";
import { SpeakerFilter } from "../components/speaker-filter";
import { WeekView } from "../components/week-view";
import { useGatherings } from "../data/gatherings";

/**
 * Published Gatherings as a list of upcoming ones, a day, a week, a month or
 * a map, optionally of one Speaker.
 */
export const GatheringsScreen = () => {
  const { t } = useTranslation("gatherings");
  const { data, isPending } = useGatherings();
  const today = Temporal.Now.plainDateISO();
  const [view, setView] = useState<GatheringView>("list");
  const [speakerId, setSpeakerId] = useState<string | null>(null);
  // The day the day, week and month views show (and the month's chosen day).
  const [date, setDate] = useState(today);

  const all = data?.gatherings ?? [];
  const speakers = data?.speakers ?? [];
  const speakerById = new Map(speakers.map((speaker) => [speaker.id, speaker]));
  const gatherings = visibleGatherings(all, speakerId);
  const hasAny = all.some((gathering) => gathering.active);
  const noneUpcoming =
    speakerId === null ? t("empty.noneUpcoming") : t("empty.noneForFilter");
  const views = {
    list: (
      <ListView
        gatherings={gatherings}
        speakers={speakerById}
        today={today}
        empty={noneUpcoming}
      />
    ),
    day: (
      <DayView
        gatherings={gatherings}
        speakers={speakerById}
        date={date}
        today={today}
        onDateChange={setDate}
      />
    ),
    week: (
      <WeekView
        gatherings={gatherings}
        speakers={speakerById}
        date={date}
        today={today}
        onDateChange={setDate}
      />
    ),
    month: (
      <MonthView
        gatherings={gatherings}
        speakers={speakerById}
        date={date}
        today={today}
        onDateChange={setDate}
      />
    ),
    map: (
      <MapView
        gatherings={upcomingGatherings(gatherings, today)}
        speakers={speakerById}
      />
    ),
  } satisfies Record<GatheringView, ReactNode>;

  let body: ReactNode = views[view];
  if (isPending) {
    body = <Spinner />;
  } else if (!hasAny) {
    body = <EmptyNotice title={t("empty.noneYet")} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      <Screen>
        {hasAny ? (
          <>
            <ToggleButtonGroup
              selectionMode="single"
              size="sm"
              accessibilityLabel={t("views.label")}
              value={[view]}
              onValueChange={([next]) => {
                const chosen = GATHERING_VIEWS.find(
                  (candidate) => candidate === next
                );
                if (chosen) {
                  setView(chosen);
                }
              }}
            >
              {GATHERING_VIEWS.map((option) => (
                <ToggleButton key={option} id={option}>
                  {t(`views.${option}`)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {speakers.length > 0 ? (
              <SpeakerFilter
                speakers={speakers}
                selected={speakerId}
                onSelect={setSpeakerId}
              />
            ) : null}
          </>
        ) : null}
        {body}
      </Screen>
    </>
  );
};
