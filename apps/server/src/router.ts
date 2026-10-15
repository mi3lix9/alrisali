import { accountRouter } from "@/features/account";
import { hijriAdjustmentRouter } from "@/features/hijri-adjustment";
import { contentReplica } from "@/shared/lib/content-replica";
import { healthCheck } from "@/shared/lib/health-check";
import { os } from "@/shared/lib/orpc";

export const appRouter = os.router({
  healthCheck,
  contentReplica,
  account: accountRouter,
  hijriAdjustment: hijriAdjustmentRouter,
});
