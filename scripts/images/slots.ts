/**
 * Every image slot on the site, built from the same data files the pages render.
 * One entry per *usage* (slotId) → the image key (path) it shows. Used by inventory, verify,
 * the review sheet and the missing-images report.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { cities } from "../../src/data/cities";
import { festivals } from "../../src/data/festivals";
import { food } from "../../src/data/food";
import { landmarks } from "../../src/data/history";
import { heroSlides, sectionImages } from "../../src/data/images";
import { outdoor } from "../../src/data/outdoor";
import { allPlaces } from "../../src/data/places";
import { shopping } from "../../src/data/shopping";

export type SlotKind = "hero" | "city-hero" | "about" | "card" | "blog-cover" | "blog-inline";

export interface Slot {
  slotId: string;
  page: string;
  component: string;
  kind: SlotKind;
  aspect: string;
  /** Minimum source width in px for this slot (brief §1d). */
  minWidth: number;
  adjacentTitle: string;
  adjacentDescription: string;
  eyebrow: string;
  city: string;
  /** The image key: the path the data file points at (= manifest key). */
  currentImage: string;
  /** What the photo must show (shot brief), from the original image shopping list. */
  brief: string;
  /** Allowed to be a "representative image" (named business, sample listing, festival elsewhere). */
  representativeOk: boolean;
}

const MIN: Record<SlotKind, number> = { hero: 2400, "city-hero": 1920, about: 1200, card: 1200, "blog-cover": 1920, "blog-inline": 1200 };
const ASPECT: Record<SlotKind, string> = { hero: "16:9 full-bleed", "city-hero": "16:9 full-bleed", about: "4:3", card: "4:3", "blog-cover": "16:9", "blog-inline": "3:2" };

const briefs: Record<string, string> = JSON.parse(readFileSync(path.join(__dirname, "briefs.json"), "utf8"));
const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cityName = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);

export function collectSlots(): Slot[] {
  const out: Slot[] = [];
  const add = (s: Omit<Slot, "minWidth" | "aspect" | "brief"> & { brief?: string }) =>
    out.push({ ...s, minWidth: MIN[s.kind], aspect: ASPECT[s.kind], brief: s.brief ?? briefs[s.currentImage] ?? s.adjacentTitle });

  // ── Home ──
  heroSlides.forEach((h) =>
    add({ slotId: `home.hero.${slug(h.label)}`, page: "/", component: "HeroCarousel", kind: "hero", adjacentTitle: h.label, adjacentDescription: h.caption, eyebrow: "Hero", city: h.image.split("/")[2], currentImage: h.image, representativeOk: false }),
  );
  add({ slotId: "home.about", page: "/", component: "About", kind: "about", adjacentTitle: sectionImages.aboutKanpur.label, adjacentDescription: "About Kanpur", eyebrow: "About", city: "kanpur", currentImage: sectionImages.aboutKanpur.image, representativeOk: false });
  const tiles: [keyof typeof sectionImages, string, string][] = [
    ["exploreTourism", "Tourism & Itinerary Planner", "Ghats, temples and a planner that builds your trip day by day."],
    ["exploreCulture", "Culture & History", "From ancient Jajmau to the mills of the Manchester of the East."],
    ["exploreCelebrations", "Celebrations", "Ganga Mela, Dev Deepawali and nights when the bazaars never sleep."],
    ["exploreFood", "Food & Night Life", "Thaggu Ke Laddu, Arya Nagar chaat and midnight handi biryani."],
    ["exploreShopping", "Shopping Streets", "Jajmau leather, Gumti bangles and Naveen Market bargains."],
    ["exploreOutdoor", "Outdoor & Sports", "Green Park cricket, forest zoo walks and river mornings."],
  ];
  tiles.forEach(([k, title, desc]) =>
    add({ slotId: `home.corner.${slug(title)}`, page: "/", component: "ImageCard (Every Corner)", kind: "card", adjacentTitle: title, adjacentDescription: `${sectionImages[k].label} — ${desc}`, eyebrow: "Explore", city: "kanpur", currentImage: sectionImages[k].image, representativeOk: false }),
  );
  cities.forEach((c) =>
    add({ slotId: `home.beyond.${c.slug}`, page: "/", component: "CityCard (Beyond Kanpur)", kind: "card", adjacentTitle: c.name, adjacentDescription: c.shortIntro, eyebrow: `~${c.distanceKm} km from Kanpur`, city: c.slug, currentImage: c.heroImage, representativeOk: false }),
  );

  // ── Explore (Kanpur) + city pages ──
  allPlaces.forEach((p) =>
    add({
      slotId: p.city === "kanpur" ? `tourism.place.${p.slug}` : `city.${p.city}.place.${p.slug}`,
      page: p.city === "kanpur" ? "/tourism" : `/cities/${p.city}`,
      component: "PlaceGrid",
      kind: "card",
      adjacentTitle: p.name,
      adjacentDescription: p.description,
      eyebrow: p.category,
      city: p.city,
      currentImage: p.image,
      representativeOk: false,
    }),
  );
  landmarks.forEach((l) =>
    add({ slotId: `culture.landmark.${l.slug}`, page: "/culture-history", component: "ImageCard", kind: "card", adjacentTitle: l.name, adjacentDescription: l.description, eyebrow: l.era, city: "kanpur", currentImage: l.image, representativeOk: false }),
  );
  festivals.forEach((f) =>
    add({ slotId: `celebrations.${f.slug}`, page: "/celebrations", component: "FilterableCards", kind: "card", adjacentTitle: f.name, adjacentDescription: f.description, eyebrow: f.month, city: "kanpur", currentImage: f.image, representativeOk: true }),
  );
  food.forEach((f) =>
    add({
      slotId: f.city === "kanpur" ? `food.${f.kind}.${f.slug}` : `city.${f.city}.food.${f.slug}`,
      page: f.city === "kanpur" ? "/food-nightlife" : `/cities/${f.city}`,
      component: "ImageCard",
      kind: "card",
      adjacentTitle: f.name,
      adjacentDescription: f.description,
      eyebrow: f.eyebrow,
      city: f.city,
      currentImage: f.image,
      representativeOk: true, // named shops and dishes: dish photos, labelled representative
    }),
  );
  shopping.forEach((s) =>
    add({
      slotId: s.city === "kanpur" ? `shopping.${s.slug}` : `city.${s.city}.shop.${s.slug}`,
      page: s.city === "kanpur" ? "/shopping" : `/cities/${s.city}`,
      component: "ImageCard",
      kind: "card",
      adjacentTitle: s.name,
      adjacentDescription: s.knownFor,
      eyebrow: s.area,
      city: s.city,
      currentImage: s.image,
      representativeOk: false,
    }),
  );
  outdoor.forEach((o) =>
    add({ slotId: `outdoor.${o.slug}`, page: "/outdoor-sports", component: "ImageCard", kind: "card", adjacentTitle: o.name, adjacentDescription: o.description, eyebrow: o.type, city: "kanpur", currentImage: o.image, representativeOk: false }),
  );
  cities.forEach((c) => {
    add({ slotId: `city.${c.slug}.hero`, page: `/cities/${c.slug}`, component: "City hero", kind: "city-hero", adjacentTitle: `${c.name} — ${c.tagline}`, adjacentDescription: c.heroAlt, eyebrow: "Nearby city", city: c.slug, currentImage: c.heroImage, representativeOk: false });
    add({ slotId: `city.${c.slug}.about`, page: `/cities/${c.slug}`, component: "City about", kind: "about", adjacentTitle: `About ${c.name}`, adjacentDescription: c.aboutAlt, eyebrow: c.tagline, city: c.slug, currentImage: c.aboutImage, representativeOk: false });
  });

  // ── Blog ──
  add({ slotId: "blog.default-cover", page: "/blogs", component: "Blog card fallback cover", kind: "blog-cover", adjacentTitle: "From Our Blogs", adjacentDescription: "Default cover for stories without their own photo", eyebrow: "Stories", city: "kanpur", currentImage: "/images/kanpur/blog-cover.jpg", representativeOk: true });
  const nav: [string, string, SlotKind, string][] = [
    ["cover", "Why Navaratri in Kanpur Is Something Everyone Must Experience!", "blog-cover", "A brightly lit Durga Puja pandal with the goddess Durga idol at night"],
    ["pandal", "Day 5 — The Pandals Open a Day Early", "blog-inline", "A themed Durga Puja pandal with the Durga idol, lit at night"],
    ["dhunuchi", "Day 6 — Garba Meets Dhunuchi Naach", "blog-inline", "Dhunuchi naach: dancers swinging smoking clay incense burners, or garba dancers in chaniya cholis"],
    ["sindoor-khela", "Day 9 — Sindoor Khela", "blog-inline", "Sindoor Khela: vermilion, red-bordered saris and the Durga idol (wide shot, no child as main subject)"],
  ];
  nav.forEach(([k, title, kind, brief]) =>
    add({ slotId: `blog.navaratri.${k}`, page: "/blogs/navaratri-in-kanpur", component: kind === "blog-cover" ? "ArticleView cover" : "Inline figure", kind, adjacentTitle: title, adjacentDescription: brief, eyebrow: "Celebrations · Kanpur", city: "kanpur", currentImage: `/images/blogs/navaratri-in-kanpur/${k}.jpg`, brief, representativeOk: true }),
  );
  return out;
}

export const cityLabel = cityName;
