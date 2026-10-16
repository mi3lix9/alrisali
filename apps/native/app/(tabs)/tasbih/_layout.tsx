import { useTranslation } from "react-i18next";

import { TabStack } from "@/shared/ui/tab-stack";

const TasbihLayout = () => {
  const { t } = useTranslation();
  return <TabStack title={t("tabs.tasbih")} />;
};

export default TasbihLayout;
