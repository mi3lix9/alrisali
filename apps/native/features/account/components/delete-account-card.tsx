import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";

import { authClient } from "@/shared/lib/auth-client";

import "../i18n";
import { useDeleteAccount } from "../hooks/use-delete-account";

/** Account deletion, for a signed-in Believer only (shown in Settings). */
export const DeleteAccountCard = () => {
  const { t } = useTranslation("account");
  const { data: session } = authClient.useSession();
  const { confirmDeleteAccount, isDeleting } = useDeleteAccount();

  if (!session) {
    return null;
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("deleteAccount.title")}</Card.Title>
        <Card.Description>{t("deleteAccount.description")}</Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button
          variant="destructive"
          loading={isDeleting}
          onPress={confirmDeleteAccount}
        >
          {t("deleteAccount.button")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
