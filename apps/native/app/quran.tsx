import { HijriCalendarButton } from "@/features/calendar";
import { FavoriteRow } from "@/features/favorites";
import { QuranReaderScreen } from "@/features/quran";
import { ShareAyahImageRow } from "@/features/share-image";

// The ayah sheet's slots sit at fixed places in its order (see AyahActions);
// within a slot, rows show in the order listed here.
const QuranRoute = () => (
  <QuranReaderScreen
    topBarActions={<HijriCalendarButton />}
    ayahActions={{
      keep: (ayah) => <FavoriteRow item={{ kind: "ayah", key: ayah }} />,
      share: (ayah) => <ShareAyahImageRow ayah={ayah} />,
    }}
  />
);

export default QuranRoute;
