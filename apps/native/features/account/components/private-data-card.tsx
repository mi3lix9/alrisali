import { useQuery } from "@tanstack/react-query";
import { Card } from "heroui-native";

import { orpc } from "@/shared/lib/orpc";

/** What the server returns only to a signed-in Believer. */
export const PrivateDataCard = () => {
  const privateData = useQuery(orpc.account.privateData.queryOptions());

  return (
    <Card variant="secondary" className="mt-6 p-4">
      <Card.Title className="mb-3">Private Data</Card.Title>
      <Card.Description>{privateData.data?.message}</Card.Description>
    </Card>
  );
};
