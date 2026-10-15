import { FavoriteButton } from "@/features/favorites";
import { QuranReaderScreen, SetLastReadButton } from "@/features/quran";

const QuranRoute = () => (
  <QuranReaderScreen
    ayahActions={(ayah) => (
      <>
        <SetLastReadButton ayah={ayah} />
        <FavoriteButton item={{ kind: "ayah", key: ayah }} />
      </>
    )}
  />
);

export default QuranRoute;
