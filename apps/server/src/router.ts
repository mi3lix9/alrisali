import { accountRouter } from "@/features/account";
import { analyticsRouter } from "@/features/analytics";
import { hijriAdjustmentRouter } from "@/features/hijri-adjustment";
import { quranRouter } from "@/features/quran";
import { contentReplica } from "@/shared/lib/content-replica";
import { healthCheck } from "@/shared/lib/health-check";
import { os } from "@/shared/lib/orpc";

export const appRouter = os.router({
  healthCheck,
  contentReplica,
  account: accountRouter,
  analytics: analyticsRouter,
  hijriAdjustment: hijriAdjustmentRouter,
  quran: quranRouter,
});
