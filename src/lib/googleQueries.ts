/**
 * Google "Map" + "Photos" links for every item on the site (v9 Google links).
 * One function per collection turns an item into its search queries and URLs, following the
 * rules in the brief: Maps queries always carry the city and "Uttar Pradesh"; Images queries
 * always carry the city; items may override with `mapsQuery` / `imagesQuery` / `placeId`.
 * Used by the pages AND by scripts/google/* (coverage + export), so the report matches the site.
 */
import placeIds from "@/data/placeIds.json";
import { cities } from "@/data/cities";
import type { City, CitySlug, Festival, FoodItem, GoogleOverrides, Institution, Place, ShopItem, Stay, TravelMode } from "@/data/types";
import type { Era, Landmark } from "@/data/history";
import type { OutdoorSpot } from "@/data/outdoor";
import { directionsUrl, imagesUrl, mapsUrl } from "./googleLinks";

export type GoogleItemType =
  | "place" | "landmark" | "timeline" | "festival" | "food-spot" | "dish" | "market" | "outdoor" | "city" | "route"
  | "getting-there" | "station" | "airport" | "itinerary-stop" | "event" | "weather" | "season" | "news-city"
  | "newspaper" | "stay-area" | "campus" | "student-tip" | "tile" | "blog-place";

export interface GoogleItem {
  /** What the link is about, for aria-labels ("Open {name} in Google Maps"). */
  name: string;
  type: GoogleItemType;
  /** City display name, e.g. "Kanpur". */
  city: string;
  area?: string;
  mapsQuery: string;
  imagesQuery: string;
  mapsUrl: string;
  imagesUrl: string;
  mapsKind: "place" | "search" | "directions";
  placeId?: string;
  /** For the export: links that land on an area/search rather than one exact place. */
  needsReview?: boolean;
  note?: string;
}

const UP = "Uttar Pradesh";
const CITY_NAMES: Record<CitySlug, string> = { kanpur: "Kanpur", ...(Object.fromEntries(cities.map((c) => [c.slug, c.name])) as Record<Exclude<CitySlug, "kanpur">, string>) };
export const cityLabel = (slug: string) => CITY_NAMES[slug as CitySlug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);

/** "JK Temple (Shri Radhakrishna Mandir)" → "JK Temple" — Google matches the common name best. */
const plainName = (name: string) => name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
/** Resolved place IDs (scripts/google/resolve-place-ids.ts); flagged matches are never used. */
const ids = placeIds as Record<string, { placeId: string; flagged?: boolean } | undefined>;
export const idKey = (type: string, city: string, name: string) => `${type}:${city.toLowerCase()}:${plainName(name).toLowerCase()}`;
/** Adds ", {city}" to an Images query that doesn't already mention the city. */
const withCity = (q: string, city: string) => (q.toLowerCase().includes(city.toLowerCase()) ? q : `${q} ${city}`);
const inUP = (q: string, city: string) => {
  const withC = q.toLowerCase().includes(city.toLowerCase()) ? q : `${q}, ${city}`;
  return withC.includes(UP) ? withC : `${withC}, ${UP}`;
};

/** Only the override fields of a data item (never its other properties). */
const ov = (x: GoogleOverrides): GoogleOverrides => ({ mapsQuery: x.mapsQuery, imagesQuery: x.imagesQuery, placeId: x.placeId, area: x.area });

function make(o: GoogleOverrides & { name: string; type: GoogleItemType; city: string; maps: string; images: string; kind?: GoogleItem["mapsKind"]; needsReview?: boolean; note?: string }): GoogleItem {
  const mapsQuery = inUP(o.mapsQuery ?? o.maps, o.city);
  const imagesQuery = withCity(o.imagesQuery ?? o.images, o.city);
  const resolved = ids[idKey(o.type, o.city, o.name)];
  const placeId = o.placeId ?? (resolved && !resolved.flagged ? resolved.placeId : undefined);
  const kind = o.kind ?? "place";
  return {
    name: o.name,
    type: o.type,
    city: o.city,
    area: o.area,
    mapsQuery,
    imagesQuery,
    mapsUrl: mapsUrl(mapsQuery, kind === "place" ? placeId : undefined),
    imagesUrl: imagesUrl(imagesQuery),
    mapsKind: kind,
    ...(placeId ? { placeId } : {}),
    ...(o.needsReview ? { needsReview: true } : {}),
    ...(o.note ? { note: o.note } : {}),
  };
}

/* ── Places, landmarks, markets, outdoor ───────────────────────────────────── */

/** "Name, Area" — the area is left out when the name already says it (e.g. Hazratganj, Hazratganj). */
const nameArea = (name: string, area?: string) => {
  const n = plainName(name);
  return area && !n.toLowerCase().includes(area.toLowerCase()) && !area.toLowerCase().includes(n.toLowerCase()) ? `${n}, ${area}` : n;
};

export const placeLinks = (p: Place): GoogleItem => {
  const city = cityLabel(p.city);
  return make({ ...ov(p), name: p.name, type: "place", city, maps: `${nameArea(p.name, p.area)}, ${city}`, images: `${plainName(p.name)} ${city}` });
};

export const landmarkLinks = (l: Landmark): GoogleItem => make({ ...ov(l), name: l.name, type: "landmark", city: "Kanpur", maps: `${plainName(l.name)}, Kanpur`, images: `${plainName(l.name)} Kanpur` });

/** Timeline eras point at the site they're about (else Kanpur itself). */
const TIMELINE_SITES: Record<string, { maps: string; images: string }> = {
  "Ancient Jajmau": { maps: "Jajmau Mound, Jajmau, Kanpur", images: "Jajmau mound Kanpur" },
  "Bithoor's Sacred Age": { maps: "Brahmavart Ghat, Bithoor, Kanpur", images: "Bithoor ghats Kanpur" },
  "Rise of Cawnpore": { maps: "Kanpur Cantonment, Kanpur", images: "Cawnpore old photographs Kanpur" },
  "The Siege of Cawnpore": { maps: "Kanpur Memorial Church, Kanpur Cantonment, Kanpur", images: "Siege of Cawnpore 1857 Kanpur" },
  "Manchester of the East": { maps: "Lal Imli Mill, Civil Lines, Kanpur", images: "Lal Imli mill Kanpur" },
  "Leather Capital & Education Hub": { maps: "IIT Kanpur, Kalyanpur, Kanpur", images: "Jajmau leather industry Kanpur" },
  "Metro City Reimagined": { maps: "Kanpur Metro, Kanpur", images: "Kanpur Metro" },
};
export const timelineLinks = (e: Era): GoogleItem => {
  const site = TIMELINE_SITES[e.title];
  return make({ ...ov(e), name: e.title, type: "timeline", city: "Kanpur", maps: site?.maps ?? "Kanpur", images: site?.images ?? `${e.title} Kanpur`, kind: site ? "place" : "search", needsReview: !site, note: site ? undefined : "No single site: opens the city." });
};

export const shopLinks = (s: ShopItem): GoogleItem => {
  const city = cityLabel(s.city);
  return make({ ...ov(s), name: s.name, type: "market", city, maps: `${nameArea(s.name, s.area)}, ${city}`, images: `${plainName(s.name)} ${city}` });
};

export const outdoorLinks = (o: OutdoorSpot): GoogleItem =>
  make({ ...ov(o), name: o.name, type: "outdoor", city: "Kanpur", maps: `${plainName(o.name)}, ${o.area}, Kanpur`, images: `${plainName(o.name)} Kanpur` });

/* ── Food ───────────────────────────────────────────────────────────────────── */

/**
 * Real named spots (e.g. Thaggu Ke Laddu) open that shop. Sample listings (made-up names) and
 * dishes open a search for the dish in the area named on the card, never the invented name.
 */
export const foodLinks = (f: FoodItem): GoogleItem => {
  const city = cityLabel(f.city);
  const area = f.area.split(/\s*(?:&|,)\s*/)[0];
  if (f.sample) {
    return make({ ...ov(f), name: f.name, type: "dish", city, maps: `${f.eyebrow} in ${area}, ${city}`, images: `${f.eyebrow} ${area} ${city}`, kind: "search", needsReview: true, note: "Sample listing: links search the dish in the area, not the made-up venue." });
  }
  const isShop = f.city === "kanpur"; // Kanpur's non-sample food cards are real named places
  return isShop
    ? make({ ...ov(f), name: f.name, type: "food-spot", city, maps: `${plainName(f.name)}, ${f.area}, ${city}`, images: `${plainName(f.name)} ${city}` })
    : make({ ...ov(f), name: f.name, type: "dish", city, maps: `${plainName(f.name)} shops in ${area}, ${city}`, images: `${plainName(f.name)} ${city}`, kind: "search" });
};

/* ── Festivals ──────────────────────────────────────────────────────────────── */

export const festivalLinks = (f: Festival): GoogleItem => {
  const where = f.where.split(/\s*&\s*/)[0];
  const general = /across the city|markets|homes/i.test(where);
  return make({
    ...f,
    type: "festival",
    city: "Kanpur",
    maps: general ? "Kanpur" : `${where}, Kanpur`,
    images: `${f.name} Kanpur`,
    kind: general ? "search" : "place",
    needsReview: general,
    note: general ? "Celebrated across the city: opens Kanpur." : undefined,
  });
};

/* ── Cities, routes, getting there ──────────────────────────────────────────── */

export const cityLinks = (c: Pick<City, "slug" | "name"> & GoogleOverrides): GoogleItem =>
  make({ ...ov(c), name: c.name, type: "city", city: c.name, maps: c.name, images: `${c.name} tourism` });

export const kanpurLinks = (): GoogleItem => make({ name: "Kanpur", type: "city", city: "Kanpur", maps: "Kanpur", images: "Kanpur tourism" });

/** Circuits like "Kanpur → Lucknow → Ayodhya": a directions link through every stop. */
export function routeLinks(name: string, citySlugs: string[]): GoogleItem {
  const stops = citySlugs.map(cityLabel);
  const last = stops[stops.length - 1];
  const item = make({ name, type: "route", city: last, maps: `${last}`, images: `Kanpur ${last} trip`, kind: "directions" });
  return {
    ...item,
    mapsQuery: `Kanpur → ${stops.join(" → ")}`,
    mapsUrl: directionsUrl({ origin: `Kanpur, ${UP}`, destination: `${last}, ${UP}`, waypoints: stops.slice(0, -1).map((s) => `${s}, ${UP}`) }),
  };
}

const STATIONS: Record<string, string> = {
  kanpur: "Kanpur Central railway station",
  lucknow: "Lucknow Charbagh railway station",
  agra: "Agra Cantt railway station",
  prayagraj: "Prayagraj Junction railway station",
  varanasi: "Varanasi Junction railway station",
  ayodhya: "Ayodhya Dham Junction railway station",
};

/** "Getting there" cards: train/road → directions from Kanpur; air → the airport. */
export function gettingThereLinks(city: Pick<City, "slug" | "name" | "nearestAirport">, m: TravelMode): GoogleItem {
  if (m.mode === "air") {
    const airport = city.nearestAirport.replace(/\s*—.*$/, "");
    return make({ ...ov(m), name: `${city.name} airport`, type: "airport", city: city.name, maps: `${airport} airport, ${city.name}`, images: `${airport} airport ${city.name}` });
  }
  const station = STATIONS[city.slug];
  const item = make({ name: `${m.title} to ${city.name}`, type: "getting-there", city: city.name, maps: m.mode === "train" ? station : city.name, images: m.mode === "train" ? station : `Kanpur to ${city.name} highway`, kind: "directions" });
  return {
    ...item,
    mapsQuery: `${m.mode === "train" ? STATIONS.kanpur : "Kanpur"} → ${m.mode === "train" ? station : city.name}`,
    mapsUrl: directionsUrl(
      m.mode === "train"
        ? { origin: `${STATIONS.kanpur}, Kanpur, ${UP}`, destination: `${station}, ${city.name}, ${UP}`, travelmode: "transit" }
        : { origin: `Kanpur, ${UP}`, destination: `${city.name}, ${UP}`, travelmode: "driving" },
    ),
  };
}

/** Home "How to Reach Kanpur" + info strip. */
export const KANPUR_TRANSPORT = {
  station: () => make({ name: "Kanpur Central (CNB)", type: "station", city: "Kanpur", maps: "Kanpur Central railway station, Kanpur", images: "Kanpur Central railway station" }),
  airport: () => make({ name: "Kanpur Airport, Chakeri (KNU)", type: "airport", city: "Kanpur", maps: "Kanpur Airport, Chakeri, Kanpur", images: "Kanpur Airport Chakeri" }),
  lucknowAirport: () => make({ name: "Lucknow Airport (LKO)", type: "airport", city: "Lucknow", maps: "Chaudhary Charan Singh International Airport, Lucknow", images: "Lucknow airport" }),
  road: () => make({ name: "Roads into Kanpur (NH-19 and NH-27)", type: "getting-there", city: "Kanpur", maps: "Kanpur", images: "Kanpur highway NH-19", kind: "search" }),
};

/** Itinerary stops: the matching place's link when the stop names one we know; else a search. */
export function stopLinks(title: string, citySlug: string, places: Place[]): GoogleItem {
  const city = cityLabel(citySlug);
  const t = plainName(title).toLowerCase();
  // Prefer the longest matching place name ("Ambedkar Memorial Park, Hazratganj" → the park).
  const match = places
    .filter((p) => p.city === citySlug && (t.includes(plainName(p.name).toLowerCase()) || plainName(p.name).toLowerCase().includes(t)))
    .sort((a, b) => plainName(b.name).length - plainName(a.name).length)[0];
  if (match) return { ...placeLinks(match), name: title, type: "itinerary-stop" };
  const clean = plainName(title).replace(/^(?:breakfast|lunch|dinner|evening|morning|sunrise|sunset)\s+(?:at|on|in)\s+/i, "");
  return make({ name: title, type: "itinerary-stop", city, maps: `${clean}, ${city}`, images: `${clean} ${city}`, kind: "search" });
}

/* ── Live pages ─────────────────────────────────────────────────────────────── */

export function eventLinks(e: { title: string; venue: string; city: string; maps_query?: string | null; images_query?: string | null }): GoogleItem {
  const city = cityLabel(e.city);
  const venue = e.venue.trim();
  return make({
    name: e.title,
    type: "event",
    city,
    maps: venue ? `${venue}, ${city}` : city,
    images: `${e.title} ${city}`,
    mapsQuery: e.maps_query || undefined,
    imagesQuery: e.images_query || undefined,
    kind: venue ? "place" : "search",
  });
}

export const weatherLinks = (citySlug: string): GoogleItem => {
  const city = cityLabel(citySlug);
  return make({ name: city, type: "weather", city, maps: city, images: `${city} weather` });
};

export const SEASON_IMAGES: Record<string, string> = { "October – March": "Kanpur winter fog", "April – June": "Kanpur summer", "July – September": "Kanpur monsoon" };
export const seasonLinks = (months: string, title: string): GoogleItem =>
  make({ name: `${title} (${months})`, type: "season", city: "Kanpur", maps: "Kanpur", images: SEASON_IMAGES[months] ?? `Kanpur ${title}` });

export const newsCityLinks = (citySlug: string): GoogleItem => {
  const city = cityLabel(citySlug);
  return make({ name: city, type: "news-city", city, maps: city, images: `${city} news` });
};

/** Newspaper directory: city papers → their city; national/state papers → Kanpur (our home city). */
export function newspaperLinks(d: { name: string; group: string }): GoogleItem {
  const slug = (Object.keys(CITY_NAMES) as CitySlug[]).find((c) => d.group === c || d.group.startsWith(`${c}-`)) ?? "kanpur";
  const city = cityLabel(slug);
  return make({ name: d.name, type: "newspaper", city, maps: `${d.name} office, ${city}`, images: `${d.name} ${city}`, kind: "search", needsReview: true, note: "Searches for the paper's office in the city." });
}

/* ── Stay & Live ────────────────────────────────────────────────────────────── */

/** Sample listings: always the AREA, never the made-up hotel name. */
export const stayLinks = (s: Stay): GoogleItem => {
  const city = cityLabel(s.city);
  return make({ ...ov(s), name: `${s.area}, ${city}`, type: "stay-area", city, maps: `${s.area}, ${city}`, images: `${s.area} ${city}`, kind: "search", needsReview: true, note: `Sample listing (${s.name}): links go to the area.` });
};

export const institutionLinks = (i: Institution): GoogleItem =>
  make({ ...ov(i), name: i.name, type: "campus", city: "Kanpur", maps: `${plainName(i.name)}, ${i.area}, Kanpur`, images: `${plainName(i.name)} campus Kanpur` });

const TIP_PLACES: Record<string, { maps: string; images: string }> = {
  "Getting around": { maps: "Kanpur Metro, Kanpur", images: "Kanpur Metro" },
  "Budget food": { maps: "Kakadeo, Kanpur", images: "Kakadeo Kanpur food" },
  "Study spots": { maps: "CSJMU central library, Kalyanpur, Kanpur", images: "CSJMU library Kanpur" },
  "Weekend plans": { maps: "Bithoor ghats, Kanpur", images: "Bithoor ghats Kanpur" },
};
export const tipLinks = (t: { title: string }): GoogleItem => {
  const place = TIP_PLACES[t.title];
  return make({ name: t.title, type: "student-tip", city: "Kanpur", maps: place?.maps ?? "Kanpur", images: place?.images ?? `${t.title} Kanpur`, kind: place ? "place" : "search", needsReview: !place });
};

/* ── Home tiles ─────────────────────────────────────────────────────────────── */

const TILES: Record<string, { maps: string; images: string }> = {
  "/tourism": { maps: "tourist attractions in Kanpur", images: "Kanpur tourism" },
  "/culture-history": { maps: "heritage sites in Kanpur", images: "Kanpur heritage" },
  "/celebrations": { maps: "Sarsaiya Ghat, Kanpur", images: "Kanpur festivals" },
  "/food-nightlife": { maps: "street food in Kanpur", images: "Kanpur street food" },
  "/shopping": { maps: "markets in Kanpur", images: "Kanpur markets" },
  "/outdoor-sports": { maps: "parks in Kanpur", images: "Kanpur parks" },
};
export const tileLinks = (href: string, title: string): GoogleItem => {
  const t = TILES[href] ?? { maps: "Kanpur", images: `${title} Kanpur` };
  return make({ name: title, type: "tile", city: "Kanpur", maps: t.maps, images: t.images, kind: "search" });
};

/* ── Blog places ────────────────────────────────────────────────────────────── */

/**
 * "Plan your visit" rows and glossary terms: shown only when the editor filled in a Maps search
 * text, or the label names a place we already list (then that place's links are used).
 */
export function blogPlaceLinks(label: string, postCity: string | null, opts: { mapsQuery?: string; imagesQuery?: string }, places: Place[]): GoogleItem | null {
  const citySlug = postCity || "kanpur";
  const city = cityLabel(citySlug);
  if (opts.mapsQuery?.trim()) {
    return make({ name: label, type: "blog-place", city, maps: opts.mapsQuery.trim(), images: opts.imagesQuery?.trim() || `${plainName(label)} ${city}` });
  }
  const t = plainName(label).toLowerCase();
  const match = places.find((p) => (p.city === citySlug || !postCity) && t.includes(plainName(p.name).toLowerCase()));
  return match ? { ...placeLinks(match), name: label, type: "blog-place" } : null;
}
