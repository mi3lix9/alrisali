import "../i18n";
import { Item } from "panelui-native";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { useRecentCities } from "../data/recent-cities";
import { useChooseLocation } from "../hooks/use-device-location";

/** Cities the Believer chose before, each with its time zone; tap to switch. */
export const RecentCitiesList = () => {
  const { t } = useTranslation("prayer-times");
  const { data: recent } = useRecentCities();
  const { choose } = useChooseLocation();

  if (!recent || recent.length === 0) {
    return null;
  }
  return (
    <Item.Group>
      <Item size="sm">
        <Item.Content>
          <Item.Title>{t("recent.title")}</Item.Title>
        </Item.Content>
      </Item>
      {recent.map(({ timeZone, ...location }) => (
        <Fragment key={`${location.latitude},${location.longitude}`}>
          <Item.Separator />
          <Item
            size="sm"
            accessibilityRole="button"
            onPress={() => choose(location)}
          >
            <Item.Content>
              <Item.Title>{location.name ?? t("location.unnamed")}</Item.Title>
              <Item.Description>
                {t("recent.timeZone", { timeZone })}
              </Item.Description>
            </Item.Content>
          </Item>
        </Fragment>
      ))}
    </Item.Group>
  );
};
