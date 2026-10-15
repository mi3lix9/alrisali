import { z } from "zod";

const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

/** Where the Believer is: coordinates, plus a place name when one is known. */
export const locationSchema = z.object({
  latitude: z.number().min(-MAX_LATITUDE).max(MAX_LATITUDE),
  longitude: z.number().min(-MAX_LONGITUDE).max(MAX_LONGITUDE),
  name: z.string().trim().min(1).nullable(),
});

export type Location = z.infer<typeof locationSchema>;
