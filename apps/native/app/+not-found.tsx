import { Link, Stack } from "expo-router";
import { Button, EmptyState } from "panelui-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/shared/ui/screen";

const NotFoundRoute = () => {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title") }} />
      <Screen>
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("notFound.title")}</EmptyState.Title>
          </EmptyState.Header>
          <EmptyState.Content>
            <Link href="/" asChild>
              <Button>{t("notFound.goHome")}</Button>
            </Link>
          </EmptyState.Content>
        </EmptyState>
      </Screen>
    </>
  );
};

export default NotFoundRoute;
