import "../i18n";
import { paceChoice } from "@alrisali/domain/prayer-assistant";
import type {
  AssistantState,
  PaceChoice,
  RecognitionMode,
  SalahDefinition,
  Sighting,
} from "@alrisali/domain/prayer-assistant";
import { router, Stack } from "expo-router";
import { Spinner } from "panelui-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import { events } from "@/shared/lib/events";
import { Screen } from "@/shared/ui/screen";

import { MatSensor } from "../components/mat-sensor";
import { PoseSensor } from "../components/pose-sensor";
import { PrayingView } from "../components/praying-view";
import { SalahSetup } from "../components/salah-setup";
import { TakbirSensor } from "../components/takbir-sensor";
import {
  usePrayerAssistantSettings,
  useUpdatePrayerAssistantSettings,
} from "../data/prayer-assistant-settings";
import { useRakahMachine } from "../hooks/use-rakah-machine";

interface PrayingProps {
  definition: SalahDefinition;
  pace: PaceChoice;
  mode: RecognitionMode;
  bowSensitivity: number;
}

interface SensorProps {
  mode: RecognitionMode;
  bowSensitivity: number;
  state: AssistantState;
  send: (sighting: Sighting) => void;
}

/** The Recognition Mode's sensor, feeding the machine; tap needs none. */
const Sensor = ({ mode, bowSensitivity, state, send }: SensorProps) => {
  switch (mode) {
    case "camera":
    case "head-height": {
      return (
        <PoseSensor
          engine={mode}
          bowSensitivity={bowSensitivity}
          calibrating={state.index === 0}
          send={send}
        />
      );
    }
    case "sound": {
      return <TakbirSensor underWay={state.index > 0} send={send} />;
    }
    case "mat": {
      return <MatSensor state={state} send={send} />;
    }
    default: {
      return null;
    }
  }
};

/**
 * Follows one prayer to its end and closes the assistant. Finishing an
 * obligatory Salah emits `SalahCompleted` (the Prayer Log ticks it and the
 * Khushu sheet opens); any other prayer is never logged.
 */
const Praying = ({ definition, pace, mode, bowSensitivity }: PrayingProps) => {
  const { state, send } = useRakahMachine(definition, pace);
  const { salah } = definition;

  useEffect(() => {
    if (!state.completed) {
      return;
    }
    if (salah) {
      events.emit("SalahCompleted", {
        date: Temporal.Now.plainDateISO().toString(),
        salah,
        completedAt: Date.now(),
      });
    }
    router.back();
  }, [state.completed, salah]);

  return (
    <PrayingView
      state={state}
      send={send}
      onStop={() => router.back()}
      notice={
        <Sensor
          mode={mode}
          bowSensitivity={bowSensitivity}
          state={state}
          send={send}
        />
      }
    />
  );
};

/** The Prayer Assistant: choose the Salah and Pace, then pray with it. */
export const PrayerAssistantScreen = () => {
  const { t } = useTranslation("prayer-assistant");
  const { data: settings } = usePrayerAssistantSettings();
  const { mutate: update } = useUpdatePrayerAssistantSettings();
  const [praying, setPraying] = useState<PrayingProps | null>(null);

  if (praying) {
    return (
      <>
        <Stack.Screen options={{ title: t("title") }} />
        <Praying
          definition={praying.definition}
          pace={praying.pace}
          mode={praying.mode}
          bowSensitivity={praying.bowSensitivity}
        />
      </>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("title") }} />
      {settings ? (
        <SalahSetup
          settings={settings}
          onChange={update}
          onStart={(definition) =>
            setPraying({
              definition,
              pace: paceChoice(settings),
              mode: settings.recognitionMode,
              bowSensitivity: settings.bowSensitivity,
            })
          }
        />
      ) : (
        <Spinner />
      )}
    </Screen>
  );
};
