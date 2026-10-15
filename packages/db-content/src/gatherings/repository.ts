import { gatheringSchema, speakerSchema } from "@alrisali/domain/gatherings";
import type { Gathering, Speaker } from "@alrisali/domain/gatherings";
import { eq } from "drizzle-orm";

import { isMissingTable } from "../shared/content-db";
import type { ContentDb } from "../shared/content-db";
import { gatherings, speakers } from "./schema";

type GatheringRow = typeof gatherings.$inferSelect;
type SpeakerRow = typeof speakers.$inferSelect;

export interface GatheringsRepository {
  /**
   * Every Gathering, inactive ones included; empty while a device's replica
   * has never pulled. A row an older app cannot read (a type added later) is
   * left out rather than failing the rest.
   */
  gatherings: () => Promise<Gathering[]>;
  gathering: (id: string) => Promise<Gathering | null>;
  speakers: () => Promise<Speaker[]>;
  speaker: (id: string) => Promise<Speaker | null>;
  /** Writes (the server only; replicas refuse). */
  saveGathering: (gathering: Gathering) => Promise<void>;
  deleteGathering: (id: string) => Promise<void>;
  saveSpeaker: (speaker: Speaker) => Promise<void>;
  deleteSpeaker: (id: string) => Promise<void>;
  /** How many Gatherings name the Speaker. */
  gatheringsOfSpeaker: (id: string) => Promise<number>;
}

const toGathering = (row: GatheringRow): Gathering | null => {
  const parsed = gatheringSchema.safeParse({
    id: row.id,
    title: { ar: row.titleAr, en: row.titleEn },
    description: { ar: row.descriptionAr, en: row.descriptionEn },
    type: row.type,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    venue: {
      name: { ar: row.venueNameAr, en: row.venueNameEn },
      address: row.venueAddress,
      latitude: row.latitude,
      longitude: row.longitude,
    },
    speakerId: row.speakerId,
    livestreamUrl: row.livestreamUrl,
    attendance: row.attendance,
    active: row.active,
  });
  return parsed.success ? parsed.data : null;
};

const toGatheringRow = (gathering: Gathering): GatheringRow => ({
  id: gathering.id,
  titleAr: gathering.title.ar,
  titleEn: gathering.title.en,
  descriptionAr: gathering.description.ar,
  descriptionEn: gathering.description.en,
  type: gathering.type,
  date: gathering.date,
  startTime: gathering.startTime,
  endTime: gathering.endTime,
  venueNameAr: gathering.venue.name.ar,
  venueNameEn: gathering.venue.name.en,
  venueAddress: gathering.venue.address,
  latitude: gathering.venue.latitude,
  longitude: gathering.venue.longitude,
  speakerId: gathering.speakerId,
  livestreamUrl: gathering.livestreamUrl,
  attendance: gathering.attendance,
  active: gathering.active,
});

const toSpeaker = (row: SpeakerRow): Speaker | null => {
  const parsed = speakerSchema.safeParse({
    id: row.id,
    name: { ar: row.nameAr, en: row.nameEn },
    photoKey: row.photoKey,
  });
  return parsed.success ? parsed.data : null;
};

const isPresent = <T>(value: T | null): value is T => value !== null;

/** An empty list while the table does not exist yet (a never-pulled replica). */
const orEmpty = async <T>(read: () => Promise<T[]>): Promise<T[]> => {
  try {
    return await read();
  } catch (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw error;
  }
};

export const createGatheringsRepository = (
  db: ContentDb
): GatheringsRepository => ({
  gatherings: async () => {
    const rows = await orEmpty(() => db.select().from(gatherings));
    return rows.map(toGathering).filter(isPresent);
  },
  gathering: async (id) => {
    const rows = await orEmpty(() =>
      db.select().from(gatherings).where(eq(gatherings.id, id))
    );
    return rows[0] ? toGathering(rows[0]) : null;
  },
  speakers: async () => {
    const rows = await orEmpty(() => db.select().from(speakers));
    return rows.map(toSpeaker).filter(isPresent);
  },
  speaker: async (id) => {
    const rows = await orEmpty(() =>
      db.select().from(speakers).where(eq(speakers.id, id))
    );
    return rows[0] ? toSpeaker(rows[0]) : null;
  },
  saveGathering: async (gathering) => {
    const row = toGatheringRow(gathering);
    await db
      .insert(gatherings)
      .values(row)
      .onConflictDoUpdate({ target: gatherings.id, set: row });
  },
  deleteGathering: async (id) => {
    await db.delete(gatherings).where(eq(gatherings.id, id));
  },
  saveSpeaker: async (speaker) => {
    const row = {
      id: speaker.id,
      nameAr: speaker.name.ar,
      nameEn: speaker.name.en,
      photoKey: speaker.photoKey,
    };
    await db
      .insert(speakers)
      .values(row)
      .onConflictDoUpdate({ target: speakers.id, set: row });
  },
  deleteSpeaker: async (id) => {
    await db.delete(speakers).where(eq(speakers.id, id));
  },
  gatheringsOfSpeaker: async (id) => {
    const rows = await db
      .select({ id: gatherings.id })
      .from(gatherings)
      .where(eq(gatherings.speakerId, id));
    return rows.length;
  },
});
