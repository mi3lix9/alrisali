import { useTranslation } from "react-i18next";

import { TabStack } from "@/shared/ui/tab-stack";

const HomeLayout = () => {
  const { t } = useTranslation();
  return <TabStack title={t("tabs.home")} />;
};

export default HomeLayout;
