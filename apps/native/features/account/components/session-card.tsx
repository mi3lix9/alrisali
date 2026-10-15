import { Card } from "heroui-native";
import { Pressable, Text } from "react-native";

import { authClient } from "@/shared/lib/auth-client";
import { events } from "@/shared/lib/events";

const signOut = async () => {
  await authClient.signOut();
  events.emit("SignedOut");
};

/** The signed-in Believer's name and email with a sign-out button. */
export const SessionCard = () => {
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <Card variant="secondary" className="mb-6 p-4">
      <Text className="text-foreground mb-2 text-base">
        Welcome, <Text className="font-medium">{session.user.name}</Text>
      </Text>
      <Text className="text-muted mb-4 text-sm">{session.user.email}</Text>
      <Pressable
        className="bg-danger self-start rounded-lg px-4 py-3 active:opacity-70"
        onPress={signOut}
      >
        <Text className="text-foreground font-medium">Sign Out</Text>
      </Pressable>
    </Card>
  );
};
