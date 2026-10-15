import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import UserMenu from "./user-menu";

export const AdminLayout = ({ children }: { children: ReactNode }) => (
  <div className="grid h-svh grid-rows-[auto_1fr]">
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          <Link to="/{-$locale}">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
    {children}
  </div>
);
