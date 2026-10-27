/**
 * Single source of truth for the navbar and footer. Add or rename pages here.
 * Note: "Stay & Live" intentionally contains only Accommodation and Campus Life.
 */
export interface NavLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  /** Eyebrow shown on inner-page heroes and breadcrumbs */
  eyebrow: string;
  /** Pathname prefixes that make this group "current" */
  match: string[];
  items: NavLink[];
}

export const homeLink: NavLink = { label: "Home", href: "/" };

export const navGroups: NavGroup[] = [
  {
    label: "Explore",
    eyebrow: "Explore",
    match: ["/tourism", "/culture-history", "/celebrations", "/food-nightlife", "/shopping", "/outdoor-sports"],
    items: [
      { label: "Tourism & Itinerary Planner", href: "/tourism" },
      { label: "Culture & History", href: "/culture-history" },
      { label: "Celebrations", href: "/celebrations" },
      { label: "Food & Night Life", href: "/food-nightlife" },
      { label: "Shopping Streets", href: "/shopping" },
      { label: "Outdoor & Sports", href: "/outdoor-sports" },
    ],
  },
  {
    label: "Nearby Cities",
    eyebrow: "Nearby Cities",
    match: ["/nearby", "/cities"],
    items: [
      { label: "Overview", href: "/nearby" },
      { label: "Lucknow", href: "/cities/lucknow" },
      { label: "Agra", href: "/cities/agra" },
      { label: "Prayagraj", href: "/cities/prayagraj" },
      { label: "Varanasi", href: "/cities/varanasi" },
      { label: "Ayodhya", href: "/cities/ayodhya" },
    ],
  },
  {
    label: "Live",
    eyebrow: "Live",
    match: ["/events", "/weather", "/news", "/playlist"],
    items: [
      { label: "Upcoming Events", href: "/events" },
      { label: "Weather", href: "/weather" },
      { label: "News", href: "/news" },
      { label: "City Playlist", href: "/playlist" },
    ],
  },
  {
    label: "Stay & Live",
    eyebrow: "Stay & Live",
    match: ["/accommodation", "/campus"],
    items: [
      { label: "Accommodation", href: "/accommodation" },
      { label: "Campus Life", href: "/campus" },
    ],
  },
];

export function groupFor(pathname: string): NavGroup | undefined {
  return navGroups.find((g) => g.match.some((m) => pathname === m || pathname.startsWith(`${m}/`)));
}

/** Every routable page, used by the sitemap and footer. */
export const allNavHrefs: string[] = ["/", ...navGroups.flatMap((g) => g.items.map((i) => i.href))];
