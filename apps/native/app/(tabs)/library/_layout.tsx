import { useTranslation } from "react-i18next";

import { TabStack } from "@/shared/ui/tab-stack";

const LibraryLayout = () => {
  const { t } = useTranslation();
  return <TabStack title={t("tabs.library")} />;
};

export default LibraryLayout;
