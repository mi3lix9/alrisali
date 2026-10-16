import { HabitsScreen } from "@/features/habits";
import { InsightsLinkCard } from "@/features/insights";
import { ActsDayCard, ProgramsLinkCard } from "@/features/programs";

const WorshipRoute = () => (
  <HabitsScreen>
    <ActsDayCard />
    <ProgramsLinkCard />
    <InsightsLinkCard />
  </HabitsScreen>
);

export default WorshipRoute;
