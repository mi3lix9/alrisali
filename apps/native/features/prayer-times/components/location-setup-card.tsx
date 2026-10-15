import "../i18n";
import { useBelieverSettings } from "@/shared/lib/believer-settings";

import { LocationCard } from "./location-card";

/** The location card on the Believer's saved location, for onboarding. */
export const LocationSetupCard = () => {
  const { data: believer } = useBelieverSettings();
  return believer ? (
    <LocationCard
      location={believer.location}
      followsDevice={believer.locationFollowsDevice}
    />
  ) : null;
};
