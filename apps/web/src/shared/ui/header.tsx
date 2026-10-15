import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

// `actions` lets the root route place a feature's controls (the admin user
// menu) here without shared/ importing a feature.
const Header = ({ actions }: { actions: ReactNode }) => {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <hr />
    </div>
  );
};

export default Header;
