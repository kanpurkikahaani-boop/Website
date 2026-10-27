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
