import { SignInCard } from "@/features/account";
import { OnboardingScreen } from "@/features/onboarding";
import { LocationSetupCard } from "@/features/prayer-times";
import { OnboardingAlerts } from "@/features/reminders";
import { CalculationMethodCard, MessageStyleCard } from "@/features/settings";

const OnboardingRoute = () => (
  <OnboardingScreen
    location={<LocationSetupCard />}
    calculationMethod={<CalculationMethodCard />}
    messageStyle={<MessageStyleCard />}
    alerts={<OnboardingAlerts />}
    signIn={<SignInCard />}
  />
);

export default OnboardingRoute;
