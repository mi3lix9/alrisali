import { Progress, Text } from "panelui-native";
import { View } from "react-native";

import { formatNumber, formatPercent } from "../utils/format";

export interface ShareRow {
  key: string;
  label: string;
  count: number;
  /** 0–1. */
  share: number;
}

/** Labelled bars for a breakdown, each with its count and percentage. */
export const ShareList = ({ rows }: { rows: readonly ShareRow[] }) => (
  <View className="gap-3">
    {rows.map((row) => (
      <View key={row.key} className="gap-1">
        <View className="flex-row justify-between gap-2">
          <Text className="flex-1">{row.label}</Text>
          <Text muted>
            {formatNumber(row.count)} · {formatPercent(row.share)}
          </Text>
        </View>
        <Progress
          value={row.share}
          minValue={0}
          maxValue={1}
          accessibilityLabel={row.label}
        />
      </View>
    ))}
  </View>
);
