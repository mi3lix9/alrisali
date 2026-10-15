import { EmptyState } from "panelui-native";
import { CalendarIcon } from "panelui-native/icons";

/** Nothing to show: no Gatherings at all, or none for the chosen filter. */
export const EmptyNotice = ({ title }: { title: string }) => (
  <EmptyState variant="card">
    <EmptyState.Header>
      <EmptyState.Media>
        <CalendarIcon size={24} />
      </EmptyState.Media>
      <EmptyState.Title>{title}</EmptyState.Title>
    </EmptyState.Header>
  </EmptyState>
);
