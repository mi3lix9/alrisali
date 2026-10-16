import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Gatherings",
  views: {
    label: "View",
    list: "List",
    day: "Day",
    week: "Week",
    month: "Month",
    map: "Map",
  },
  speakers: {
    label: "Filter by Speaker",
    all: "All",
  },
  types: {
    majlis: "Majlis",
    lecture: "Lecture",
    celebration: "Celebration",
    mourning: "Mourning",
  },
  attendance: {
    title: "Who may attend",
    everyone: "Everyone",
    men: "Men",
    women: "Women",
  },
  empty: {
    noneYet: "No Gatherings published yet.",
    noneForFilter: "No upcoming Gatherings for this Speaker.",
    noneUpcoming: "No upcoming Gatherings.",
    noneOnDay: "No Gatherings on this day.",
    noneInWeek: "No Gatherings this week.",
    noneOnMap: "No Gatherings to show on the map.",
  },
  day: {
    previous: "Previous day",
    next: "Next day",
    today: "Today",
  },
  week: {
    previous: "Previous week",
    next: "Next week",
    thisWeek: "This week",
  },
  month: {
    previous: "Previous month",
    next: "Next month",
    thisMonth: "This month",
    count_one: "{{count}} Gathering",
    count_two: "{{count}} Gatherings",
    count_few: "{{count}} Gatherings",
    count_many: "{{count}} Gatherings",
    count_other: "{{count}} Gatherings",
    count_zero: "No Gatherings",
  },
  weekdays: {
    sat: "Sa",
    sun: "Su",
    mon: "Mo",
    tue: "Tu",
    wed: "We",
    thu: "Th",
    fri: "Fr",
  },
  map: {
    unavailable: "Maps are not available on this device.",
    openDetails: "View details",
  },
  detail: {
    notFound: "This Gathering does not exist or is no longer published.",
    when: "When",
    venue: "Venue",
    openInMaps: "Open in Maps",
    speaker: "Speaker",
    watchLivestream: "Watch livestream",
    about: "About",
  },
  home: {
    title: "Upcoming Gatherings",
    seeAll: "See all",
  },
};
