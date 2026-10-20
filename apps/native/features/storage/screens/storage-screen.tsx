import "../i18n";
import { Card } from "panelui-native";
import type { ReactNode } from "react";

import { Screen } from "@/shared/ui/screen";

import { StorageSummaryCard } from "../components/storage-summary-card";
import { WifiOnlyItem } from "../components/wifi-only-item";

/**
 * Storage and downloads: the total, the Wi-Fi only switch, then a section per
 * kind of download. The route passes the sections in (recitation, adhans), so
 * each feature owns its own list.
 */
export const StorageScreen = ({ children }: { children?: ReactNode }) => (
  <Screen>
    <StorageSummaryCard />
    <Card>
      <Card.Content>
        <WifiOnlyItem />
      </Card.Content>
    </Card>
    {children}
  </Screen>
);
