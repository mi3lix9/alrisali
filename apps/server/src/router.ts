import { accountRouter } from "@/features/account";
import { contactRouter } from "@/features/contact";
import { hijriAdjustmentRouter } from "@/features/hijri-adjustment";
import { quranRouter } from "@/features/quran";
import { contentReplica } from "@/shared/lib/content-replica";
import { healthCheck } from "@/shared/lib/health-check";
import { os } from "@/shared/lib/orpc";

export const appRouter = os.router({
  healthCheck,
  contentReplica,
  account: accountRouter,
  contact: contactRouter,
  hijriAdjustment: hijriAdjustmentRouter,
  quran: quranRouter,
});
