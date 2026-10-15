import { HabitsScreen } from "@/features/habits";
import { InsightsLinkCard } from "@/features/insights";
import { ProgramsLinkCard } from "@/features/programs";

const WorshipRoute = () => (
  <HabitsScreen>
    <ProgramsLinkCard />
    <InsightsLinkCard />
  </HabitsScreen>
);

export default WorshipRoute;
