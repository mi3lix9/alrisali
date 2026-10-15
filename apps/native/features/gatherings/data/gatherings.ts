import { fileUrl } from "@alrisali/api/shared";
import { createGatheringsRepository } from "@alrisali/db-content/gatherings";
import type { GatheringsRepository } from "@alrisali/db-content/gatherings";
import type { Gathering, Speaker } from "@alrisali/domain/gatherings";
import { useQuery } from "@tanstack/react-query";

import {
  CONTENT_QUERY_KEY,
  getContentReplica,
} from "@/shared/lib/content-database";
import { ENV } from "@/src/env";

const GATHERINGS_QUERY_KEY = [...CONTENT_QUERY_KEY, "gatherings"];

const gatheringsRepository = async (): Promise<GatheringsRepository> => {
  const replica = await getContentReplica();
  return createGatheringsRepository(replica.db);
};

export interface GatheringsContent {
  /** Every published Gathering, active or not; browse with the domain's helpers. */
  gatherings: Gathering[];
  speakers: Speaker[];
}

/** Every Gathering and Speaker on the device (empty until the first pull). */
export const useGatherings = () =>
  useQuery({
    queryKey: [...GATHERINGS_QUERY_KEY, "all"],
    queryFn: async (): Promise<GatheringsContent> => {
      const repository = await gatheringsRepository();
      const [gatherings, speakers] = await Promise.all([
        repository.gatherings(),
        repository.speakers(),
      ]);
      return { gatherings, speakers };
    },
  });

/** One Gathering with its Speaker; `null` when it is gone or inactive. */
export const useGathering = (id: string) =>
  useQuery({
    queryKey: [...GATHERINGS_QUERY_KEY, "one", id],
    queryFn: async (): Promise<{
      gathering: Gathering;
      speaker: Speaker | null;
    } | null> => {
      const repository = await gatheringsRepository();
      const gathering = await repository.gathering(id);
      if (!gathering?.active) {
        return null;
      }
      const speaker = gathering.speakerId
        ? await repository.speaker(gathering.speakerId)
        : null;
      return { gathering, speaker };
    },
  });

/** Where a Speaker's photo loads from (the server redirects to the file). */
export const speakerPhotoUrl = (speaker: Speaker): string | null =>
  speaker.photoKey === null
    ? null
    : fileUrl(ENV.EXPO_PUBLIC_SERVER_URL, speaker.photoKey);
