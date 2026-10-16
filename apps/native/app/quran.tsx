import { HijriCalendarButton } from "@/features/calendar";
import { AyahFavoritesList, FavoriteRow } from "@/features/favorites";
import {
  CompletePortionBanner,
  MarkDoneTillRow,
  useKhatmahDecorations,
} from "@/features/khatmah";
import { AyahNoteRow, QuranReaderScreen, RibbonRows } from "@/features/quran";
import { ShareAyahImageRow } from "@/features/share-image";

// The ayah sheet's slots sit at fixed places in its order (see AyahActions);
// within a slot, rows show in the order listed here.
const QuranRoute = () => {
  const khatmahPortion = useKhatmahDecorations();
  return (
    <QuranReaderScreen
      topBarActions={<HijriCalendarButton />}
      savedFavorites={AyahFavoritesList}
      decorations={khatmahPortion}
      ayahActions={{
        banner: (ayah) => (
          <>
            <CompletePortionBanner ayah={ayah} />
            <MarkDoneTillRow ayah={ayah} />
          </>
        ),
        keep: (ayah) => (
          <>
            <FavoriteRow item={{ kind: "ayah", key: ayah }} />
            <RibbonRows ayah={ayah} />
            <AyahNoteRow ayah={ayah} />
          </>
        ),
        share: (ayah) => <ShareAyahImageRow ayah={ayah} />,
      }}
    />
  );
};

export default QuranRoute;
