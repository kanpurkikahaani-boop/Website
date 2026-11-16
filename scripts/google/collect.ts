/**
 * Every item on the site that gets Google "Map" + "Photos" links (v9 Google links), built with the
 * SAME functions the pages use (src/lib/googleQueries.ts), so coverage and the export match the
 * site exactly. Database items (events, other blog posts) are covered at render time; the
 * Navaratri post is included from its source file.
 */
import { navaratriPost } from "../../content/blogs/navaratri-in-kanpur.meta";
import { institutions, studentTips } from "../../src/data/campus";
import { circuits } from "../../src/data/circuits";
import { cities } from "../../src/data/cities";
import { festivals } from "../../src/data/festivals";
import { food } from "../../src/data/food";
import { landmarks, timeline } from "../../src/data/history";
import { directoryCandidates } from "../../src/data/newsSources";
import { outdoor } from "../../src/data/outdoor";
import { allPlaces, kanpurPlaces } from "../../src/data/places";
import { shopping } from "../../src/data/shopping";
import { stays } from "../../src/data/stays";
import type { CitySlug, Interest, NearbyCitySlug } from "../../src/data/types";
import {
  blogPlaceLinks, cityLabel, cityLinks, festivalLinks, foodLinks, gettingThereLinks, institutionLinks, KANPUR_TRANSPORT, kanpurLinks,
  landmarkLinks, newsCityLinks, newspaperLinks, outdoorLinks, placeLinks, routeLinks, seasonLinks, shopLinks, stayLinks, stopLinks,
  tileLinks, timelineLinks, tipLinks, weatherLinks, type GoogleItem,
} from "../../src/lib/googleQueries";
import { generateItinerary } from "../../src/lib/itinerary";

export interface Row {
  page: string;
  section: string;
  /** City the links must point into (checked by coverage). */
  expectCity: string;
  item: GoogleItem;
}

const CITY_SLUGS: CitySlug[] = ["kanpur", "lucknow", "agra", "prayagraj", "varanasi", "ayodhya"];
const TILES: [string, string][] = [
  ["/tourism", "Tourism & Itinerary Planner"], ["/culture-history", "Culture & History"], ["/celebrations", "Celebrations"],
  ["/food-nightlife", "Food & Night Life"], ["/shopping", "Shopping Streets"], ["/outdoor-sports", "Outdoor & Sports"],
];
const SEASONS: [string, string][] = [["October – March", "Cool & clear"], ["April – June", "Peak summer"], ["July – September", "Green & humid"]];

export function collect(): Row[] {
  const rows: Row[] = [];
  const add = (page: string, section: string, item: GoogleItem, expectCity = item.city) => rows.push({ page, section, expectCity, item });

  // Home
  add("/", "Info strip", kanpurLinks(), "Kanpur");
  add("/", "Info strip", KANPUR_TRANSPORT.station(), "Kanpur");
  add("/", "Info strip", KANPUR_TRANSPORT.airport(), "Kanpur");
  add("/", "Info strip", KANPUR_TRANSPORT.lucknowAirport(), "Lucknow");
  add("/", "About", kanpurLinks());
  for (const t of [KANPUR_TRANSPORT.station(), KANPUR_TRANSPORT.road(), KANPUR_TRANSPORT.airport()]) add("/", "How to Reach", t);
  add("/", "Map", kanpurLinks());
  for (const [href, title] of TILES) add("/", "Every Corner tiles", tileLinks(href, title));
  for (const c of cities) add("/", "Beyond Kanpur city cards", cityLinks(c));

  // Explore
  for (const p of kanpurPlaces) add("/tourism", "Places", placeLinks(p));
  const interests: Interest[] = ["history", "food", "nature", "shopping"];
  const plan = generateItinerary({ days: 5, interests, cities: ["lucknow", "agra"] as NearbyCitySlug[], places: allPlaces, allCities: cities, food });
  for (const d of plan.days) for (const s of d.stops) add("/tourism", "Itinerary planner (5-day sample)", stopLinks(s.title, d.city, allPlaces), cityLabel(d.city));
  for (const e of timeline) add("/culture-history", "Timeline", timelineLinks(e));
  for (const l of landmarks) add("/culture-history", "Landmarks", landmarkLinks(l));
  for (const f of festivals) add("/celebrations", "Festivals", festivalLinks(f));
  for (const f of food.filter((x) => x.city === "kanpur")) add("/food-nightlife", `Food (${f.kind})`, foodLinks(f));
  for (const s of shopping.filter((x) => x.city === "kanpur")) add("/shopping", "Markets", shopLinks(s));
  for (const o of outdoor) add("/outdoor-sports", "Outdoor & sports", outdoorLinks(o));

  // Nearby + city pages
  for (const c of cities) add("/nearby", "Hub map cities", cityLinks(c));
  for (const c of cities) add("/nearby", "Comparison table", cityLinks(c));
  for (const c of circuits) add("/nearby", "Circuits", routeLinks(c.name, c.cities), cityLabel(c.cities[c.cities.length - 1]));
  for (const c of cities) {
    const page = `/cities/${c.slug}`;
    add(page, "Hero", cityLinks(c));
    add(page, "Quick facts", routeLinks(`Kanpur to ${c.name}`, [c.slug]));
    add(page, "Quick facts", gettingThereLinks(c, { mode: "air", title: "By Air", body: "" }));
    for (const p of allPlaces.filter((x) => x.city === c.slug)) add(page, "Places", placeLinks(p));
    for (const f of food.filter((x) => x.city === c.slug)) add(page, "Food", foodLinks(f));
    for (const s of shopping.filter((x) => x.city === c.slug)) add(page, "Shopping", shopLinks(s));
    for (const m of c.gettingThere) add(page, "Getting there", gettingThereLinks(c, m));
    for (const d of [...c.itinerary.oneDay, ...c.itinerary.twoDay]) for (const s of d.stops) add(page, "Itinerary", stopLinks(s.title, c.slug, allPlaces), c.name);
    for (const o of cities.filter((x) => x.slug !== c.slug)) add(page, "Explore other cities", cityLinks(o));
  }

  // Live
  for (const s of CITY_SLUGS) add("/events", "BookMyShow city cards", cityLinks({ slug: s as never, name: cityLabel(s), imagesQuery: `${cityLabel(s)} events` }));
  for (const s of CITY_SLUGS) add("/weather", "Selected city", weatherLinks(s));
  for (const [months, title] of SEASONS) add("/weather", "Seasons", seasonLinks(months, title));
  for (const s of CITY_SLUGS) add(`/news/${s}`, "City header", newsCityLinks(s));
  for (const d of directoryCandidates) add("/news", "Newspaper directory", newspaperLinks(d));

  // Stay & Live
  for (const s of stays) add("/accommodation", "Stays (area)", stayLinks(s));
  for (const i of institutions) add("/campus", "Institutions", institutionLinks(i));
  for (const t of studentTips) add("/campus", "Student tips", tipLinks(t));

  // Blog (source file of the published Navaratri post; other posts are built at render time)
  const post = navaratriPost as unknown as { slug: string; city: string | null; planVisit?: { label: string; mapsQuery?: string; imagesQuery?: string }[]; glossary?: { term: string; mapsQuery?: string; imagesQuery?: string }[] };
  for (const p of post.planVisit ?? []) {
    const g = blogPlaceLinks(p.label, post.city, p, allPlaces);
    if (g) add(`/blogs/${post.slug}`, "Plan your visit", g);
  }
  for (const p of post.glossary ?? []) {
    const g = blogPlaceLinks(p.term, post.city, p, allPlaces);
    if (g) add(`/blogs/${post.slug}`, "Glossary", g);
  }
  return rows;
}

/** Blog rows that name a place but have no links yet (for the report: add search text in the editor). */
export function blogRowsWithoutLinks() {
  const post = navaratriPost as unknown as { slug: string; city: string | null; planVisit?: { group: string; label: string; mapsQuery?: string }[] };
  return (post.planVisit ?? []).filter((p) => !blogPlaceLinks(p.label, post.city, p, allPlaces)).map((p) => `${p.group} → ${p.label}`);
}
