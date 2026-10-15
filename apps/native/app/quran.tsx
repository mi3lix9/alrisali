import { FavoriteButton } from "@/features/favorites";
import { QuranReaderScreen } from "@/features/quran";

const QuranRoute = () => (
  <QuranReaderScreen
    ayahActions={(ayah) => (
      <FavoriteButton item={{ kind: "ayah", key: ayah }} />
    )}
  />
);

export default QuranRoute;
