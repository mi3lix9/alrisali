import {
  locationSchema,
  MAX_LATITUDE,
  MAX_LONGITUDE,
  readNumber,
} from "@alrisali/domain/shared";
import type { Location } from "@alrisali/domain/shared";
import { Button, Card, Input } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";
import { localizeDigits } from "@/shared/lib/numbers";

const LocationForm = ({ saved }: { saved: Location | null }) => {
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

  const save = () => {
    const location = locationSchema.safeParse({
      latitude: readNumber(latitude),
      longitude: readNumber(longitude),
      name: name.trim() === "" ? null : name,
    });
    setInvalid(!location.success);
    if (location.success) {
      // Typed by hand, so it stays put when the Believer travels.
      update({ location: location.data, locationFollowsDevice: false });
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
      </Card.Content>
      <Card.Footer>
        <Button onPress={save} disabled={isPending}>
          {t("location.save")}
        </Button>
      </Card.Footer>
    </>
  );
};

export const LocationCard = () => {
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
      {settings ? <LocationForm saved={settings.location} /> : null}
    </Card>
  );
};
