import { SignInCard } from "@/features/account";
import { OnboardingScreen } from "@/features/onboarding";
import { LocationSetupCard } from "@/features/prayer-times";
import { CalculationMethodCard, MessageStyleCard } from "@/features/settings";

const OnboardingRoute = () => (
  <OnboardingScreen
    location={<LocationSetupCard />}
    calculationMethod={<CalculationMethodCard />}
    messageStyle={<MessageStyleCard />}
    signIn={<SignInCard />}
  />
);

export default OnboardingRoute;
