import { TodaysWorshipCard } from "@/features/daily-content";
import { HabitsScreen } from "@/features/habits";
import { InsightsLinkCard } from "@/features/insights";
import { useAfterMaghrib } from "@/features/prayer-times";
import { ActsDayCard, ProgramsLinkCard } from "@/features/programs";

const WorshipRoute = () => {
  const afterMaghrib = useAfterMaghrib();
  return (
    <HabitsScreen>
      <TodaysWorshipCard afterMaghrib={afterMaghrib} />
      <ActsDayCard />
      <ProgramsLinkCard />
      <InsightsLinkCard />
    </HabitsScreen>
  );
};

export default WorshipRoute;
