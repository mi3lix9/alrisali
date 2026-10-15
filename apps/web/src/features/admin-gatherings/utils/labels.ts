import type { Attendance, GatheringType } from "@alrisali/domain/gatherings";

export const TYPE_LABELS: Record<GatheringType, string> = {
  majlis: "Majlis",
  lecture: "Lecture",
  celebration: "Celebration",
  mourning: "Mourning",
};

export const ATTENDANCE_LABELS: Record<Attendance, string> = {
  everyone: "Everyone",
  men: "Men only",
  women: "Women only",
};
