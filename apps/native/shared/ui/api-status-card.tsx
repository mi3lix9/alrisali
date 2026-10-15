import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Chip, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { orpc } from "@/shared/lib/orpc";

/** Whether the oRPC server answers its health check. */
export const ApiStatusCard = () => {
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());
  const isConnected = healthCheck.data === "OK";
  const { isLoading } = healthCheck;

  const mutedColor = useThemeColor("muted");
  const successColor = useThemeColor("success");
  const dangerColor = useThemeColor("danger");

  let connectionLabel = "API Disconnected";
  if (isLoading) {
    connectionLabel = "Checking connection...";
  } else if (isConnected) {
    connectionLabel = "Connected to API";
  }

  return (
    <Card variant="secondary" className="p-6">
      <View className="mb-4 flex-row items-center justify-between">
        <Card.Title>System Status</Card.Title>
        <Chip
          variant="secondary"
          color={isConnected ? "success" : "danger"}
          size="sm"
        >
          <Chip.Label>{isConnected ? "LIVE" : "OFFLINE"}</Chip.Label>
        </Chip>
      </View>

      <Card className="p-4">
        <View className="flex-row items-center">
          <View
            className={`mr-3 h-3 w-3 rounded-full ${isConnected ? "bg-success" : "bg-muted"}`}
          />
          <View className="flex-1">
            <Text className="text-foreground mb-1 font-medium">
              ORPC Backend
            </Text>
            <Card.Description>{connectionLabel}</Card.Description>
          </View>
          {isLoading && (
            <Ionicons name="hourglass-outline" size={20} color={mutedColor} />
          )}
          {!isLoading && isConnected && (
            <Ionicons name="checkmark-circle" size={20} color={successColor} />
          )}
          {!isLoading && !isConnected && (
            <Ionicons name="close-circle" size={20} color={dangerColor} />
          )}
        </View>
      </Card>
    </Card>
  );
};
