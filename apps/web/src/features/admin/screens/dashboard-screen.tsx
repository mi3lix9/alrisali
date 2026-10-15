import { Link } from "@tanstack/react-router";

import type { Session } from "@/shared/lib/auth-client";

const SECTIONS = [
  {
    to: "/admin/hijri-adjustment",
    title: "Hijri Adjustment",
    description:
      "Shift every Believer's Hijri Date to match the official moon sighting.",
  },
  {
    to: "/admin/daily-content",
    title: "Daily Content",
    description: "Choose the Supplication Home features on each weekday.",
  },
  {
    to: "/admin/occasions",
    title: "Occasions",
    description:
      "Add, edit and delete the Occasions shown beside the built-in ones.",
  },
  {
    to: "/admin/gatherings",
    title: "Gatherings",
    description:
      "Publish majalis, lectures and other Gatherings, and the Speakers who lead them.",
  },
  {
    to: "/admin/programs",
    title: "Official Programs",
    description:
      "Create, order and activate the General and Seasonal Programs and their Acts.",
  },
  {
    to: "/admin/messages",
    title: "Messages",
    description:
      "Read Contact Messages from Believers and Guests, and track replies.",
  },
] as const;

export const DashboardScreen = ({ session }: { session: Session }) => (
  <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="text-muted-foreground">
        Signed in as {session.user.name}. Published content reaches every device
        on its next sync.
      </p>
    </div>
    <ul className="grid gap-4 sm:grid-cols-2">
      {SECTIONS.map((section) => (
        <li key={section.to}>
          <Link
            to={section.to}
            className="hover:bg-muted block border p-4 transition-colors"
          >
            <h2 className="font-medium">{section.title}</h2>
            <p className="text-muted-foreground text-sm">
              {section.description}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  </main>
);
