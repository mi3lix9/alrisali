import { Text, View } from "react-native";

import {
  PrivateDataCard,
  SessionCard,
  SignedOutForms,
} from "@/features/account";
import { ApiStatusCard } from "@/shared/ui/api-status-card";
import { Container } from "@/shared/ui/container";

// Home composes features; it holds no logic of its own (ADR-0005).
const Home = () => (
  <Container className="p-6">
    <View className="mb-6 py-4">
      <Text className="text-foreground mb-2 text-4xl font-bold">
        BETTER T STACK
      </Text>
    </View>
    <SessionCard />
    <ApiStatusCard />
    <PrivateDataCard />
    <SignedOutForms />
  </Container>
);

export default Home;
