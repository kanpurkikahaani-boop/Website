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

/**
 * Image manifest: where each photo comes from and under what licence. `npm run images:verify`
 * checks every entry exists on disk with the recorded size, and has a source, licence and alt text.
 */
export type ImageSource = "own" | "wikimedia" | "unsplash" | "other";

export interface ManifestImage {
  path: string;
  width: number;
  height: number;
  alt: string;
  source: ImageSource;
  license: string;
  /** Shown on a credits page (team photos are our own, so no). */
  credit?: boolean;
}

const OWN = "© Kanpur Ki Kahaani team, used with permission";

/** The team's own portraits (/team). Original files, no AI processing — only next/image resizing + CSS cropping. */
export const teamPhotos: ManifestImage[] = [
  { path: "/images/team/monisha-ms.jpg", width: 413, height: 531, alt: "Portrait of Monisha MS, Blog Editor at Kanpur Ki Kahaani", source: "own", license: OWN, credit: false },
  { path: "/images/team/chinmayi-srinivasan.jpg", width: 1367, height: 2048, alt: "Portrait of Chinmayi Srinivasan, Web Designer at Kanpur Ki Kahaani", source: "own", license: OWN, credit: false },
  { path: "/images/team/piyusha-taunk.jpg", width: 865, height: 865, alt: "Portrait of Piyusha Taunk, Content Strategist at Kanpur Ki Kahaani", source: "own", license: OWN, credit: false },
  { path: "/images/team/rakshaa-mukesh.jpg", width: 1280, height: 853, alt: "Portrait of Rakshaa Mukesh, Reddit & Medium Lead at Kanpur Ki Kahaani", source: "own", license: OWN, credit: false },
  { path: "/images/team/lakshmi-gayathri.jpg", width: 1536, height: 2048, alt: "Portrait of Lakshmi Gayathri, Instagram & Facebook Lead at Kanpur Ki Kahaani", source: "own", license: OWN, credit: false },
  { path: "/images/team/aksheet-dhanvijay.jpg", width: 928, height: 1027, alt: "Portrait of Aksheet Dhanvijay, Outreach Lead at Kanpur Ki Kahaani", source: "own", license: OWN, credit: false },
  { path: "/images/team/kallu-hasika-reddy.jpg", width: 960, height: 1111, alt: "Portrait of Kallu Hasika Reddy, SEO & Promotions Lead at Kanpur Ki Kahaani", source: "own", license: OWN, credit: false },
];

export const imageManifest: ManifestImage[] = [...teamPhotos];
