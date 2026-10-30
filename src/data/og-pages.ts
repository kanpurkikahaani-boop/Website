import { cities } from "./cities";

/** Titles for the per-page Open Graph images served at /og/{key}. */
export const ogPages: Record<string, { title: string; eyebrow: string }> = {
  tourism: { title: "Tourism in Kanpur", eyebrow: "Explore" },
  "culture-history": { title: "Culture & History", eyebrow: "Explore" },
  celebrations: { title: "Celebrations", eyebrow: "Explore" },
  "food-nightlife": { title: "Food & Night Life", eyebrow: "Explore" },
  shopping: { title: "Shopping Streets", eyebrow: "Explore" },
  "outdoor-sports": { title: "Outdoor & Sports", eyebrow: "Explore" },
  nearby: { title: "Beyond Kanpur", eyebrow: "Nearby Cities" },
  events: { title: "Upcoming Events", eyebrow: "Live" },
  weather: { title: "Kanpur Weather", eyebrow: "Live" },
  news: { title: "Kanpur News", eyebrow: "Live" },
  playlist: { title: "City Playlist", eyebrow: "Live" },
  accommodation: { title: "Accommodation", eyebrow: "Stay & Live" },
  campus: { title: "Campus Life", eyebrow: "Stay & Live" },
  privacy: { title: "Privacy", eyebrow: "Kanpur Ki Kahaani" },
  blogs: { title: "From Our Blogs", eyebrow: "Stories" },
  ...Object.fromEntries(
    cities.map((c) => [`city-${c.slug}`, { title: `${c.name} — ${c.tagline}`, eyebrow: `Nearby city · ~${c.distanceKm} km from Kanpur` }]),
  ),
};
