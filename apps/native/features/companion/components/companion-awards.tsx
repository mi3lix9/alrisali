import "../i18n";
import type { XpEvent } from "@alrisali/domain/companion";
import { captureException } from "@sentry/react-native";
import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { toast } from "panelui-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { events } from "@/shared/lib/events";

import { awardXp } from "../data/companion";
import type { LevelUp } from "../data/companion";
import { listenForXp } from "../utils/xp-events";

/**
 * Mount once: awards Companion XP for each logged Salah, completed Act or
 * Habit, Dhikr Session, Reading Completion and finished Lesson, and
 * celebrates a level-up wherever the Believer is.
 */
export const CompanionAwards = () => {
  const { t } = useTranslation("companion");

  useEffect(() => {
    const celebrate = async ({ level, stage }: LevelUp) => {
      toast.show({
        variant: "success",
        label: t("levelUp.title", { level }),
        description: t("levelUp.description", { stage: t(`stages.${stage}`) }),
      });
      try {
        await notificationAsync(NotificationFeedbackType.Success);
      } catch {
        // A device without haptics still sees the celebration.
      }
    };

    const reward = async (event: XpEvent) => {
      try {
        const levelUp = await awardXp(event);
        if (levelUp) {
          await celebrate(levelUp);
        }
      } catch (error) {
        captureException(error);
      }
    };

    return listenForXp(events, (event) => {
      void reward(event);
    });
  }, [t]);

  return null;
};
