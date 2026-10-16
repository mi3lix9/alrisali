import { useTranslation } from "react-i18next";

import { TabStack } from "@/shared/ui/tab-stack";

const PrayerLayout = () => {
  const { t } = useTranslation();
  return <TabStack title={t("features.prayer")} />;
};

export default PrayerLayout;
