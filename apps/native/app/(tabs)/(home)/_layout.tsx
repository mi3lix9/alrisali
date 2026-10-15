import { useTranslation } from "react-i18next";

import { TabStack } from "@/shared/ui/tab-stack";

// Home's header carries the app's name, as the prototype's does; the tab
// itself is still labelled Home.
const HomeLayout = () => {
  const { t } = useTranslation();
  return <TabStack title={t("appName")} />;
};

export default HomeLayout;
