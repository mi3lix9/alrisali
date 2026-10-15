import { accountRouter } from "@/features/account";
import { dailyContentRouter } from "@/features/daily-content";
import { gatheringsRouter } from "@/features/gatherings";
import { hijriAdjustmentRouter } from "@/features/hijri-adjustment";
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
  dailyContent: dailyContentRouter,
  gatherings: gatheringsRouter,
  hijriAdjustment: hijriAdjustmentRouter,
  occasions: occasionsRouter,
  programs: programsRouter,
  quran: quranRouter,
});
