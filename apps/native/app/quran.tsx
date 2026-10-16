import { HijriCalendarButton } from "@/features/calendar";
import { FavoriteRow } from "@/features/favorites";
import { CompletePortionBanner } from "@/features/khatmah";
import { QuranReaderScreen } from "@/features/quran";

// The ayah sheet's slots sit at fixed places in its order (see AyahActions);
// within a slot, rows show in the order listed here.
const QuranRoute = () => (
  <QuranReaderScreen
    topBarActions={<HijriCalendarButton />}
    ayahActions={{
      banner: (ayah) => <CompletePortionBanner ayah={ayah} />,
      keep: (ayah) => <FavoriteRow item={{ kind: "ayah", key: ayah }} />,
    }}
  />
);

export default QuranRoute;
