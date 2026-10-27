/**
 * Shared content types. Every content file in `src/data/` is typed against these,
 * so TypeScript will tell you if a field is missing or misspelled when you edit copy.
 */

export type CitySlug = "kanpur" | "lucknow" | "agra" | "prayagraj" | "varanasi" | "ayodhya";
export type NearbyCitySlug = Exclude<CitySlug, "kanpur">;

/** Path relative to /public, e.g. "/images/kanpur/jk-temple.jpg" */
export type ImagePath = `/images/${CitySlug}/${string}.jpg`;

export type PlaceCategory = "heritage" | "temple" | "nature" | "museum" | "market";
export type Interest = "history" | "food" | "nature" | "shopping";

export interface Place {
  slug: string;
  city: CitySlug;
  name: string;
  category: PlaceCategory;
  description: string;
  area: string;
  /** Human label for the chip, e.g. "1–2 hrs" */
  duration: string;
  /** Rough hours used by the itinerary planner */
  hours: number;
  /** Best part of the day to visit — used by the planner */
  bestSlot: "morning" | "afternoon" | "evening";
  /** Which interests this place satisfies */
  interests: Interest[];
  /** Cluster id used to keep same-day stops close together */
  zone?: string;
  image: ImagePath;
  alt: string;
  priority?: number;
}

export interface FoodItem {
  slug: string;
  city: CitySlug;
  kind: "street" | "restaurant" | "cafe" | "nightlife";
  eyebrow: string;
  name: string;
  description: string;
  area: string;
  price: string;
  image: ImagePath;
  alt: string;
  sample?: boolean;
}

export interface ShopItem {
  slug: string;
  city: CitySlug;
  area: string;
  name: string;
  knownFor: string;
  bestTime: string;
  image: ImagePath;
  alt: string;
}

export interface TravelMode {
  mode: "train" | "road" | "air";
  title: string;
  body: string;
}

export interface ItineraryDay {
  title: string;
  stops: { time: string; title: string; note: string }[];
}

export interface City {
  slug: NearbyCitySlug;
  name: string;
  hindi: string;
  tagline: string;
  shortIntro: string;
  /** 150–160 character meta description for /cities/[slug] */
  metaDescription: string;
  about: string[];
  /** VERIFY: approximate road distance from Kanpur */
  distanceKm: number;
  driveTime: string;
  trainTime: string;
  fastestWay: string;
  nearestAirport: string;
  bestTime: string;
  bestFor: string;
  lat: number;
  lon: number;
  heroImage: ImagePath;
  heroAlt: string;
  aboutImage: ImagePath;
  aboutAlt: string;
  gettingThere: TravelMode[];
  itinerary: { oneDay: ItineraryDay[]; twoDay: ItineraryDay[] };
  /** Position on the /nearby hub-and-spoke map (0–100 in both axes) */
  mapPos: { x: number; y: number };
  /** Can this city be done as a day trip from Kanpur in the planner? */
  dayTrip: boolean;
}

export interface Festival {
  slug: string;
  month: string;
  /** 1–12, used by the month filter */
  monthIndex: number;
  name: string;
  description: string;
  where: string;
  image: ImagePath;
  alt: string;
}

export interface EventItem {
  slug: string;
  city: CitySlug;
  category: "CULTURAL" | "SPORTS" | "EXPO" | "MUSIC" | "FESTIVAL" | "LITERATURE";
  title: string;
  /** ISO date (YYYY-MM-DD) */
  start: string;
  end?: string;
  venue: string;
  description: string;
  url: string;
  sample: true;
}

export interface NewsItem {
  slug: string;
  city: CitySlug;
  source: string;
  date: string;
  headline: string;
  image: ImagePath;
  alt: string;
  url: string;
  sample: true;
}

export type StayTier = "budget" | "mid-range" | "luxury";

export interface Stay {
  slug: string;
  city: CitySlug;
  tier: StayTier;
  name: string;
  area: string;
  priceRange: string;
  description: string;
  sample: true;
}

export interface Institution {
  slug: string;
  area: string;
  name: string;
  description: string;
  programmes: string[];
  /** Official website — only include links you have checked */
  url?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  date: string;
  author: string;
  category: string;
  image: ImagePath;
  alt: string;
  /** Markdown-lite: paragraphs separated by blank lines, "## " for subheadings */
  body: string;
  related: string[];
}

export interface Video {
  id: string;
  title: string;
  caption: string;
}
