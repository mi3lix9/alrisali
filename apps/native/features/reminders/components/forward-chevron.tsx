import { ChevronRightIcon } from "panelui-native/icons";
import { useCSSVariable } from "uniwind";

/** The "opens a page" chevron; panelui mirrors it in a right-to-left layout. */
export const ForwardChevron = () => {
  const color = useCSSVariable("--color-muted-foreground");
  return (
    <ChevronRightIcon
      size={18}
      {...(typeof color === "string" ? { color } : {})}
    />
  );
};
