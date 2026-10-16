import { HijriCalendarButton } from "@/features/calendar";
import { AyahFavoritesList, FavoriteRow } from "@/features/favorites";
import { QuranReaderScreen, RibbonRows } from "@/features/quran";

// The ayah sheet's slots sit at fixed places in its order (see AyahActions);
// within a slot, rows show in the order listed here.
const QuranRoute = () => (
  <QuranReaderScreen
    topBarActions={<HijriCalendarButton />}
    savedFavorites={AyahFavoritesList}
    ayahActions={{
      keep: (ayah) => (
        <>
          <FavoriteRow item={{ kind: "ayah", key: ayah }} />
          <RibbonRows ayah={ayah} />
        </>
      ),
    }}
  />
);

export default QuranRoute;
