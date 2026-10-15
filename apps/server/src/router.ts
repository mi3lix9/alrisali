import { accountRouter } from "@/features/account";
import { quranRouter } from "@/features/quran";
import { healthCheck } from "@/shared/lib/health-check";
import { os } from "@/shared/lib/orpc";

export const appRouter = os.router({
  healthCheck,
  account: accountRouter,
  quran: quranRouter,
});
