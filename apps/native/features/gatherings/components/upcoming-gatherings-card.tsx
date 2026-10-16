import "../i18n";
import {
  upcomingGatherings,
  visibleGatherings,
} from "@alrisali/domain/gatherings";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import { useGatherings } from "../data/gatherings";
import { GatheringList } from "./gathering-list";

/** How many upcoming Gatherings Home shows. */
const SHOWN = 3;

/** The next few Gatherings, for Home; opens every Gathering. */
export const UpcomingGatheringsCard = () => {
  const { t } = useTranslation("gatherings");
  const { data } = useGatherings();
  const today = Temporal.Now.plainDateISO();
  const speakers = new Map(
    (data?.speakers ?? []).map((speaker) => [speaker.id, speaker])
  );
  const next = upcomingGatherings(
    visibleGatherings(data?.gatherings ?? [], null),
    today
  ).slice(0, SHOWN);

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("home.title")}</Card.Title>
      </Card.Header>
      <Card.Content>
        <GatheringList
          gatherings={next}
          speakers={speakers}
          empty={t("empty.noneUpcoming")}
          showDate
        />
      </Card.Content>
      <Card.Footer>
        <Button variant="outline" onPress={() => router.push("/gatherings")}>
          {t("home.seeAll")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
