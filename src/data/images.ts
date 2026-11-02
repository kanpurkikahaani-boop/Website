import type { ImagePath } from "./types";

/**
 * Images used outside the place/food/shop data (hero slides, section images).
 * Every image path used on the site lives in a typed data file; see IMAGE_CREDITS.md
 * for the full list of files to add under /public/images.
 */
export interface Slide {
  image: ImagePath;
  alt: string;
  label: string;
  caption: string;
}

export const heroSlides: Slide[] = [
  { image: "/images/kanpur/hero-bithoor-ghats.jpg", alt: "Dawn over the Ganga from the ghats of Bithoor, Kanpur", label: "Bithoor Ghats", caption: "Ganga ghats at Bithoor" },
  { image: "/images/kanpur/hero-jk-temple.jpg", alt: "JK Temple's white marble spires lit at dusk", label: "JK Temple", caption: "JK Temple, Sarvodaya Nagar" },
  { image: "/images/kanpur/hero-memorial-church.jpg", alt: "Red-brick Gothic facade of Kanpur Memorial Church", label: "Kanpur Memorial Church", caption: "Kanpur Memorial Church, 1875" },
  { image: "/images/kanpur/hero-phool-bagh.jpg", alt: "Phool Bagh gardens and memorial on Mall Road, Kanpur", label: "Phool Bagh", caption: "Phool Bagh, Mall Road" },
  { image: "/images/varanasi/hero-beyond-kanpur.jpg", alt: "Evening aarti lamps on the Varanasi ghats — a trip beyond Kanpur", label: "Beyond Kanpur", caption: "Beyond Kanpur — Varanasi, Lucknow, Agra and more" },
];

export const sectionImages = {
  aboutKanpur: { image: "/images/kanpur/about-kanpur.jpg" as ImagePath, alt: "Kanpur's riverfront and city skyline along the Ganga", label: "The Manchester of the East" },
  exploreTourism: { image: "/images/kanpur/explore-tourism.jpg" as ImagePath, alt: "Visitors at the Bithoor ghats near Kanpur", label: "Tourism & Itinerary Planner" },
  exploreCulture: { image: "/images/kanpur/lal-imli-mill.jpg" as ImagePath, alt: "Lal Imli mill clock tower, Kanpur", label: "Culture & History" },
  exploreCelebrations: { image: "/images/kanpur/ganga-mela.jpg" as ImagePath, alt: "Colour-filled streets during Ganga Mela in Kanpur", label: "Celebrations" },
  exploreFood: { image: "/images/kanpur/arya-nagar-chaat.jpg" as ImagePath, alt: "Plate of chaat in Kanpur", label: "Food & Night Life" },
  exploreShopping: { image: "/images/kanpur/gumti-no-5.jpg" as ImagePath, alt: "Bangle stalls at Gumti No. 5, Kanpur", label: "Shopping Streets" },
  exploreOutdoor: { image: "/images/kanpur/green-park-stadium.jpg" as ImagePath, alt: "Green Park Stadium, Kanpur", label: "Outdoor & Sports" },
};

import photoData from "./photos.json";

/**
 * Photo manifest — the single source of truth for every photo on the site (v5).
 *
 * Keyed by the image path the data files and pages already point at (e.g.
 * "/images/kanpur/jk-temple.jpg"), so a slot's data never changes when its photo does.
 * Entries are written by `scripts/images/process.ts` after a human has looked at the photo,
 * and checked by `npm run images:verify` (runs before every build).
 *
 * A path with no entry renders the gradient fallback tile — a wrong photo is worse than none.
 */
export type ImageSource = "own" | "wikimedia" | "unsplash" | "pexels" | "flickr";

export interface PhotoAlternate {
  sourcePageUrl: string;
  thumbUrl?: string;
  author?: string;
  license?: string;
  scores?: { relevance: number; quality: number; fit: number };
  note?: string;
}

export interface Photo {
  /** Local path under /public, or an images.unsplash.com URL (Unsplash must be hotlinked). */
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  /** CSS object-position keeping the subject in frame at every aspect ratio. */
  objectPosition: string;
  /** Tiny plain-downscaled JPEG data URL (no AI), for placeholder="blur". */
  blurDataURL?: string;
  /** What the photo actually shows. */
  subject: string;
  /** True when it shows the dish / area / festival rather than the exact named place. */
  representative: boolean;
  source: ImageSource;
  sourcePageUrl?: string;
  author?: string;
  authorUrl?: string;
  license: string;
  licenseUrl?: string;
  /** Non-AI technical changes only, e.g. "Resized; format converted". */
  changes?: string;
  captureDate?: string;
  camera?: string;
  /** Evidence it is a real, unedited photograph (EXIF, photographer, date…). */
  aiCheck?: string;
  relevanceNote?: string;
  alternates?: PhotoAlternate[];
  /** Listed on /credits (team portraits: false). */
  credit?: boolean;
  /** Unsplash only: the download_location endpoint that was triggered on selection. */
  downloadLocation?: string;
}

const OWN = "© Kanpur Ki Kahaani team, used with permission";

/** The team's own portraits (/team). Original files, no AI processing — only next/image resizing + CSS cropping. */
const team = (file: string, width: number, height: number, name: string, role: string): [string, Photo] => [
  `/images/team/${file}.jpg`,
  {
    src: `/images/team/${file}.jpg`,
    width,
    height,
    alt: `Portrait of ${name}, ${role} at Kanpur Ki Kahaani`,
    objectPosition: "50% 30%",
    subject: `${name}, ${role}`,
    representative: false,
    source: "own",
    license: OWN,
    changes: "None (served by next/image)",
    aiCheck: "Team's own photograph, supplied by the team",
    credit: false,
  },
];

export const teamPhotoEntries: [string, Photo][] = [
  team("monisha-ms", 413, 531, "Monisha MS", "Blog Editor"),
  team("chinmayi-srinivasan", 1367, 2048, "Chinmayi Srinivasan", "Web Designer"),
  team("piyusha-taunk", 865, 865, "Piyusha Taunk", "Content Strategist"),
  team("rakshaa-mukesh", 1280, 853, "Rakshaa Mukesh", "Reddit & Medium Lead"),
  team("lakshmi-gayathri", 1536, 2048, "Lakshmi Gayathri", "Instagram & Facebook Lead"),
  team("aksheet-dhanvijay", 928, 1027, "Aksheet Dhanvijay", "Outreach Lead"),
  team("kallu-hasika-reddy", 960, 1111, "Kallu Hasika Reddy", "SEO & Promotions Lead"),
];

/** Every photo, keyed by image path. Site photos come from photos.json (generated); team photos above. */
export const photos: Record<string, Photo> = {
  ...(photoData as Record<string, Photo>),
  ...Object.fromEntries(teamPhotoEntries),
};

export const photoFor = (key: string): Photo | undefined => photos[key];

/** One-line credit, e.g. "Photo: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons (resized)". */
export function creditLine(p: Photo): string {
  if (p.source === "own") return p.license;
  const via = { wikimedia: "via Wikimedia Commons", unsplash: "on Unsplash", pexels: "on Pexels", flickr: "via Flickr" }[p.source];
  const lic = p.source === "unsplash" || p.source === "pexels" ? "" : `, ${p.license}`;
  return `Photo: ${p.author ?? "unknown"}${lic} ${via}${p.changes && p.source !== "unsplash" ? " (resized)" : ""}`;
}
