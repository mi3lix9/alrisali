import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/shared/lib/orpc";
import Loader from "@/shared/ui/loader";

import { GatheringsSection } from "../components/gatherings-section";
import { SpeakersSection } from "../components/speakers-section";

export const GatheringsScreen = () => {
  const list = useQuery(orpc.gatherings.list.queryOptions());

  if (list.isPending) {
    return <Loader />;
  }
  if (list.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load Gatherings: {list.error.message}
      </p>
    );
  }

  const { gatherings, speakers } = list.data;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Gatherings</h1>
        <p className="text-muted-foreground">
          What Admins publish here reaches every device on its next sync.
        </p>
      </div>
      <GatheringsSection gatherings={gatherings} speakers={speakers} />
      <SpeakersSection speakers={speakers} gatherings={gatherings} />
    </main>
  );
};
