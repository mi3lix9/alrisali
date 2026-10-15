import { Avatar, Button, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import "../i18n";
import { useSignOut } from "../hooks/use-sign-out";

export interface Believer {
  name: string;
  email: string;
  image?: string | null | undefined;
}

/** The signed-in Believer, and the way out. */
export const BelieverCard = ({ believer }: { believer: Believer }) => {
  const { t } = useTranslation("account");
  const { confirmSignOut, isSigningOut } = useSignOut();
  const displayName = believer.name || believer.email;

  return (
    <Card>
      <Card.Content className="flex-row items-center gap-3">
        <Avatar
          size="lg"
          fallback={displayName.slice(0, 1).toUpperCase()}
          {...(believer.image ? { source: { uri: believer.image } } : {})}
        />
        <View className="flex-1 gap-1">
          <Text className="text-muted-foreground text-sm">
            {t("believer.signedInAs")}
          </Text>
          <Text className="text-base font-semibold">{displayName}</Text>
          {believer.name ? (
            <Text className="text-muted-foreground text-sm">
              {believer.email}
            </Text>
          ) : null}
        </View>
      </Card.Content>
      <Card.Footer>
        <Button
          variant="destructive"
          loading={isSigningOut}
          onPress={confirmSignOut}
        >
          {t("signOut.button")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
