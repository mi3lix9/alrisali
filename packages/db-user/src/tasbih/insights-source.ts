import type { DhikrSessionSource, TasbihLabel } from "@alrisali/domain/shared";
import { TASBIH_AL_ZAHRA_ID } from "@alrisali/domain/tasbih";
import { sql } from "drizzle-orm";

import { localDateOf } from "../shared";
import type { InsightsSourceReader } from "../shared";

/**
 * Dhikr Sessions as Insights read them, oldest first, each naming its
 * Tasbih; a deleted Open Tasbih's sessions still count, as removed.
 */
export const readDhikrSessionsInsightsSource: InsightsSourceReader<
  DhikrSessionSource
> = async (db, timeZone) => {
  const rows = await db.values<
    [string, number, number, string | null, string | null]
  >(
    sql`SELECT dhikr_sessions.tasbih_id, dhikr_sessions.count,
               dhikr_sessions.completed_at, tasbih.kind, tasbih.name
        FROM dhikr_sessions
        LEFT JOIN tasbih ON tasbih.id = dhikr_sessions.tasbih_id
        ORDER BY dhikr_sessions.completed_at, dhikr_sessions.id`
  );
  return rows.flatMap(([tasbihId, count, completedAt, kind, name]) => {
    if (!Number.isInteger(count) || count <= 0) {
      return [];
    }
    let tasbih: TasbihLabel = { kind: "removed" };
    if (tasbihId === TASBIH_AL_ZAHRA_ID) {
      tasbih = { kind: "tasbih-al-zahra" };
    } else if (kind === "open" && name !== null) {
      tasbih = { kind: "open", name };
    }
    return [
      { tasbihId, tasbih, count, date: localDateOf(completedAt, timeZone) },
    ];
  });
};
