import { useTranslation } from "react-i18next";

import { TabStack } from "@/shared/ui/tab-stack";

const WorshipLayout = () => {
  const { t } = useTranslation();
  return <TabStack title={t("tabs.worship")} />;
};

export default WorshipLayout;
