import { SafeAreaView as BaseSafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

/**
 * react-native-safe-area-context's SafeAreaView with `className` support.
 * Uniwind styles React Native's own components only; the bare SafeAreaView
 * drops `className`, so a `flex-1` screen collapses to its fixed children
 * and a `flex-1` ScrollView inside it gets no height at all.
 */
export const SafeAreaView = withUniwind(BaseSafeAreaView);
