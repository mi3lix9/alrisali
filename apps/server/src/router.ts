import { accountRouter } from "@/features/account";
import { analyticsRouter } from "@/features/analytics";
import { announcementsRouter } from "@/features/announcements";
import { contactRouter } from "@/features/contact";
import { dailyContentRouter } from "@/features/daily-content";
import { gatheringsRouter } from "@/features/gatherings";
import { hijriAdjustmentRouter } from "@/features/hijri-adjustment";
import { lessonsRouter } from "@/features/lessons";
import { libraryAssetsRouter } from "@/features/library-assets";
import { occasionsRouter } from "@/features/occasions";
import { programsRouter } from "@/features/programs";
import { quranRouter } from "@/features/quran";
import { contentReplica } from "@/shared/lib/content-replica";
import { healthCheck } from "@/shared/lib/health-check";
import { os } from "@/shared/lib/orpc";
import { createUpload } from "@/shared/lib/uploads";

export const appRouter = os.router({
  healthCheck,
  contentReplica,
  createUpload,
  account: accountRouter,
  contact: contactRouter,
  analytics: analyticsRouter,
  announcements: announcementsRouter,
  dailyContent: dailyContentRouter,
  gatherings: gatheringsRouter,
  hijriAdjustment: hijriAdjustmentRouter,
  lessons: lessonsRouter,
  libraryAssets: libraryAssetsRouter,
  occasions: occasionsRouter,
  programs: programsRouter,
  quran: quranRouter,
});
