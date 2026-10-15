import type {
  DistractionBreakdown,
  MoodDistribution,
} from "@alrisali/domain/insights";
import { Card, Text } from "panelui-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ar } from "../i18n/ar";
import { isLabelled } from "../utils/format";
import { ShareList } from "./share-list";
import type { ShareRow } from "./share-list";

const BreakdownCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <Card>
    <Card.Header>
      <Card.Title>{title}</Card.Title>
      <Card.Description>{description}</Card.Description>
    </Card.Header>
    <Card.Content>{children}</Card.Content>
  </Card>
);

/** How the Believer felt over the last 30 days. */
export const MoodsCard = ({ moods }: { moods: MoodDistribution }) => {
  const { t } = useTranslation("insights");
  const rows = moods.moods.map(({ mood, count, share }): ShareRow => ({
    key: mood,
    label: isLabelled(ar.moods.mood, mood)
      ? t(`moods.mood.${mood}`)
      : t("moods.other"),
    count,
    share,
  }));

  return (
    <BreakdownCard
      title={t("moods.title")}
      description={t("moods.description")}
    >
      {rows.length === 0 ? (
        <Text muted>{t("moods.empty")}</Text>
      ) : (
        <ShareList rows={rows} />
      )}
    </BreakdownCard>
  );
};

/** What distracted the Believer in the Salah they logged and rated. */
export const DistractionsCard = ({
  distractions,
}: {
  distractions: DistractionBreakdown;
}) => {
  const { t } = useTranslation("insights");
  const rows = distractions.distractions.map(
    ({ distraction, count, share }): ShareRow => {
      let label = t("distractions.custom");
      if (distraction !== null) {
        label = isLabelled(ar.distractions.distraction, distraction)
          ? t(`distractions.distraction.${distraction}`)
          : t("distractions.other");
      }
      return { key: distraction ?? "", label, count, share };
    }
  );

  return (
    <BreakdownCard
      title={t("distractions.title")}
      description={t("distractions.description")}
    >
      {rows.length === 0 ? (
        <Text muted>{t("distractions.empty")}</Text>
      ) : (
        <ShareList rows={rows} />
      )}
    </BreakdownCard>
  );
};
