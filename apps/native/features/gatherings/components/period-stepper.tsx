import { Button, Text } from "panelui-native";
import { ChevronLeftIcon, ChevronRightIcon } from "panelui-native/icons";
import { View } from "react-native";

/**
 * Previous / next around a day, week or month, and a way back to the one
 * holding today when `onReset` is given.
 */
export const PeriodStepper = ({
  title,
  subtitle,
  labels,
  onPrevious,
  onNext,
  onReset,
}: {
  title: string;
  subtitle: string;
  labels: { previous: string; next: string; reset: string };
  onPrevious: () => void;
  onNext: () => void;
  onReset: (() => void) | null;
}) => (
  <View className="gap-2">
    <View className="flex-row items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={labels.previous}
        onPress={onPrevious}
      >
        <ChevronLeftIcon size={20} />
      </Button>
      <View className="flex-1 items-center">
        <Text weight="semibold" className="text-center">
          {title}
        </Text>
        <Text size="sm" muted className="text-center">
          {subtitle}
        </Text>
      </View>
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={labels.next}
        onPress={onNext}
      >
        <ChevronRightIcon size={20} />
      </Button>
    </View>
    {onReset ? (
      <Button variant="outline" size="sm" onPress={onReset}>
        {labels.reset}
      </Button>
    ) : null}
  </View>
);
