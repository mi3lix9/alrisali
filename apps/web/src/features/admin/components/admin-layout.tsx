import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import UserMenu from "./user-menu";

const NAV_LINK = "text-muted-foreground hover:text-foreground";
const ACTIVE_LINK = "text-foreground font-medium";

export const AdminLayout = ({ children }: { children: ReactNode }) => (
  <div className="grid h-svh grid-rows-[auto_1fr]">
    <header className="border-b">
      <div className="flex flex-row items-center justify-between gap-6 px-4 py-2">
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/admin" className="text-base font-semibold">
            Al-Risali Admin
          </Link>
          <Link
            to="/admin"
            activeOptions={{ exact: true }}
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Overview
          </Link>
          <Link
            to="/admin/hijri-adjustment"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Hijri Adjustment
          </Link>
          <Link
            to="/admin/announcements"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Announcements
          </Link>
        </nav>
        <UserMenu />
      </div>
    </header>
    <div className="overflow-y-auto">{children}</div>
  </div>
);
