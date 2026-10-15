import type { ContractRouterClient } from "@orpc/contract";

import { accountContract } from "./account";
import { analyticsContract } from "./analytics";
import { announcementsContract } from "./announcements";
import { contactContract } from "./contact";
import { dailyContentContract } from "./daily-content";
import { gatheringsContract } from "./gatherings";
import { hijriAdjustmentContract } from "./hijri-adjustment";
import { libraryAssetsContract } from "./library-assets";
import { occasionsContract } from "./occasions";
import { programsContract } from "./programs";
import { quranContract } from "./quran";
import { sharedContract } from "./shared";

// The whole oRPC API: each feature's contract under its own key. The server
// implements it; the apps call it through a client typed from it.
export const contract = {
  ...sharedContract,
  account: accountContract,
  contact: contactContract,
  analytics: analyticsContract,
  announcements: announcementsContract,
  dailyContent: dailyContentContract,
  gatherings: gatheringsContract,
  hijriAdjustment: hijriAdjustmentContract,
  libraryAssets: libraryAssetsContract,
  occasions: occasionsContract,
  programs: programsContract,
  quran: quranContract,
};

export type AppRouterClient = ContractRouterClient<typeof contract>;
