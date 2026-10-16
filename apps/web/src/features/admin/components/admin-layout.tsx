import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import UserMenu from "./user-menu";

const NAV_LINK = "text-muted-foreground hover:text-foreground";
const ACTIVE_LINK = "text-foreground font-medium";

export const AdminLayout = ({
  children,
  messagesBadge,
}: {
  children: ReactNode;
  /** Beside the Messages link: the unread count, composed in by the route. */
  messagesBadge?: ReactNode;
}) => (
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
            to="/admin/analytics"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Usage analytics
          </Link>
          <Link
            to="/admin/announcements"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Announcements
          </Link>
          <Link
            to="/admin/daily-content"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Daily Content
          </Link>
          <Link
            to="/admin/worship"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Today&apos;s worship
          </Link>
          <Link
            to="/admin/amal"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            A&apos;mal
          </Link>
          <Link
            to="/admin/occasions"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Occasions
          </Link>
          <Link
            to="/admin/gatherings"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Gatherings
          </Link>
          <Link
            to="/admin/library"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Library
          </Link>
          <Link
            to="/admin/programs"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Official Programs
          </Link>
          <Link
            to="/admin/lessons"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Lessons
          </Link>
          <Link
            to="/admin/adhans"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Adhans
          </Link>
          <Link
            to="/admin/messages"
            className={NAV_LINK}
            activeProps={{ className: ACTIVE_LINK }}
          >
            Messages
            {messagesBadge}
          </Link>
        </nav>
        <UserMenu />
      </div>
    </header>
    <div className="overflow-y-auto">{children}</div>
  </div>
);
