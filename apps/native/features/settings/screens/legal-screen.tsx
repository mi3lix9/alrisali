import { legalDocuments } from "@alrisali/i18n/legal";
import type { LegalDocuments } from "@alrisali/i18n/legal";
import { Text } from "panelui-native";
import { View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

/**
 * The Privacy Policy or the Terms of Service, the same text the website
 * publishes, in the language this launch runs in.
 */
export const LegalScreen = ({
  document,
}: {
  document: keyof LegalDocuments;
}) => {
  const { lastUpdated, sections } = legalDocuments[launchLanguage][document];

  return (
    <Screen>
      <Text size="sm" muted>
        {lastUpdated}
      </Text>
      {sections.map((section) => (
        <View key={section.heading} className="gap-2">
          <Text size="lg" weight="semibold" accessibilityRole="header">
            {section.heading}
          </Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph}>{paragraph}</Text>
          ))}
          {section.items?.map((item) => (
            <Text key={item}>{`• ${item}`}</Text>
          ))}
        </View>
      ))}
    </Screen>
  );
};

export const PrivacyScreen = () => <LegalScreen document="privacy" />;

export const TermsScreen = () => <LegalScreen document="terms" />;
