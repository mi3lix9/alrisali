import { Button } from "heroui-native";
import { View } from "react-native";

import { Container } from "@/shared/ui/container";

/** Throws an uncaught error on press, to check that Sentry receives app errors. */
export const SentryTestErrorScreen = () => (
  <Container>
    <View className="flex-1 items-center justify-center p-4">
      <Button
        onPress={() => {
          throw new Error("Sentry test error (native)");
        }}
      >
        <Button.Label>Throw test error</Button.Label>
      </Button>
    </View>
  </Container>
);
