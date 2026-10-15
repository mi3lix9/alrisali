import { accountRouter } from "@/features/account";
import { hijriAdjustmentRouter } from "@/features/hijri-adjustment";
import { occasionsRouter } from "@/features/occasions";
import { quranRouter } from "@/features/quran";
import { contentReplica } from "@/shared/lib/content-replica";
import { healthCheck } from "@/shared/lib/health-check";
import { os } from "@/shared/lib/orpc";

export const appRouter = os.router({
  healthCheck,
  contentReplica,
  account: accountRouter,
  hijriAdjustment: hijriAdjustmentRouter,
  occasions: occasionsRouter,
  quran: quranRouter,
});
