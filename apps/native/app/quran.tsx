import { HijriCalendarButton } from "@/features/calendar";
import { FavoriteButton } from "@/features/favorites";
import { QuranReaderScreen, SetLastReadButton } from "@/features/quran";

const QuranRoute = () => (
  <QuranReaderScreen
    topBarActions={<HijriCalendarButton />}
    ayahActions={(ayah) => (
      <>
        <SetLastReadButton ayah={ayah} />
        <FavoriteButton item={{ kind: "ayah", key: ayah }} />
      </>
    )}
  />
);

export default QuranRoute;
