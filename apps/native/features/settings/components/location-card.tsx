import {
  manualLocation,
  MAX_LATITUDE,
  MAX_LONGITUDE,
} from "@alrisali/domain/shared";
import type { Location } from "@alrisali/domain/shared";
import { Button, Card, Input } from "panelui-native";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";
import { localizeDigits } from "@/shared/lib/numbers";

interface LocationCardProps {
  /** Told of each place the Believer types in, to keep it among Recent Cities. */
  onLocationChosen?: (location: Location) => void;
  /** Other features' content for this card, such as the Recent Cities. */
  extras?: ReactNode;
}

const LocationForm = ({
  saved,
  onLocationChosen,
  extras,
}: { saved: Location | null } & LocationCardProps) => {
  const { t } = useTranslation("settings");
  const { mutate: update, isPending } = useUpdateBelieverSettings();
  const [name, setName] = useState(saved?.name ?? "");
  // Shown in the interface's digits; readNumber reads either.
  const [latitude, setLatitude] = useState(
    saved ? localizeDigits(String(saved.latitude)) : ""
  );
  const [longitude, setLongitude] = useState(
    saved ? localizeDigits(String(saved.longitude)) : ""
  );
  const [invalid, setInvalid] = useState(false);
  const [timeZone, setTimeZone] = useState<string | null>(null);

  const save = () => {
    const resolved = manualLocation(latitude, longitude, name);
    setInvalid(resolved === null);
    setTimeZone(resolved?.timeZone ?? null);
    if (resolved) {
      // Typed by hand, so it stays put when the Believer travels.
      update({ location: resolved.location, locationFollowsDevice: false });
      onLocationChosen?.(resolved.location);
    }
  };

  return (
    <>
      <Card.Content className="gap-3">
        <Input
          label={t("location.name")}
          value={name}
          onChangeText={setName}
          autoComplete="off"
        />
        <Input
          label={t("location.latitude")}
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numbers-and-punctuation"
          {...(invalid
            ? {
                errorMessage: t("location.invalid", {
                  latitude: MAX_LATITUDE,
                  longitude: MAX_LONGITUDE,
                }),
              }
            : {})}
        />
        <Input
          label={t("location.longitude")}
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numbers-and-punctuation"
        />
        {timeZone ? (
          <Card.Description>
            {t("location.timeZone", { timeZone })}
          </Card.Description>
        ) : null}
        {extras}
      </Card.Content>
      <Card.Footer>
        <Button onPress={save} disabled={isPending}>
          {t("location.save")}
        </Button>
      </Card.Footer>
    </>
  );
};

export const LocationCard = ({
  onLocationChosen,
  extras,
}: LocationCardProps) => {
  const { t } = useTranslation("settings");
  const { data: settings } = useBelieverSettings();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("location.title")}</Card.Title>
        <Card.Description>
          {settings?.location
            ? t("location.description")
            : t("location.notSet")}
        </Card.Description>
      </Card.Header>
      {settings ? (
        <LocationForm
          // Starts over when another saved location (a Recent City) is chosen.
          key={`${settings.location?.latitude},${settings.location?.longitude}`}
          saved={settings.location}
          {...(onLocationChosen ? { onLocationChosen } : {})}
          {...(extras ? { extras } : {})}
        />
      ) : null}
    </Card>
  );
};
