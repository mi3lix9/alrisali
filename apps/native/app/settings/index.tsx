import {
  DeleteAccountCard,
  ExportDataCard,
  GuestNudge,
} from "@/features/account";
import { BirthYearCard } from "@/features/analytics";
import { AnnouncementsCard } from "@/features/announcements";
import { RecentCitiesList, useRememberCity } from "@/features/prayer-times";
import { QuranReaderSettingsCard } from "@/features/quran";
import { SettingsScreen } from "@/features/settings";
import { TasbihSettingsCard } from "@/features/tasbih";

const SettingsRoute = () => {
  const { mutate: remember } = useRememberCity();
  return (
    <SettingsScreen
      onLocationChosen={remember}
      locationExtras={<RecentCitiesList />}
      featureCards={
        <>
          <AnnouncementsCard />
          <QuranReaderSettingsCard />
          <BirthYearCard />
          <TasbihSettingsCard />
          <GuestNudge showSignIn />
          <ExportDataCard />
          <DeleteAccountCard />
        </>
      }
    />
  );
};

export default SettingsRoute;
