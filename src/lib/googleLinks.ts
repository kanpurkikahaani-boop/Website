/**
 * The ONLY place Google URLs are built (v9 Google links). Uses Google's official, key-free Maps
 * URLs (`api=1` — opens the Maps app on phones) and a Google Images search. We only link to
 * Google: nothing is downloaded, embedded or hot-linked.
 */

/** Google's Images tab parameter. Kept in one constant in case Google changes it (fallback: ["tbm", "isch"]). */
export const IMAGES_PARAM: [string, string] = ["udm", "2"];

export function mapsUrl(q: string, placeId?: string) {
  const u = new URL("https://www.google.com/maps/search/");
  u.searchParams.set("api", "1");
  u.searchParams.set("query", q);
  if (placeId) u.searchParams.set("query_place_id", placeId);
  return u.toString();
}

export function imagesUrl(q: string) {
  const u = new URL("https://www.google.com/search");
  u.searchParams.set("q", q);
  u.searchParams.set(IMAGES_PARAM[0], IMAGES_PARAM[1]); // Google's Images tab
  return u.toString();
}

/** Directions (routes and "getting there"): https://www.google.com/maps/dir/?api=1&origin=…&destination=… */
export function directionsUrl({ origin, destination, waypoints = [], travelmode }: { origin: string; destination: string; waypoints?: string[]; travelmode?: "driving" | "transit" | "walking" | "bicycling" }) {
  const u = new URL("https://www.google.com/maps/dir/");
  u.searchParams.set("api", "1");
  u.searchParams.set("origin", origin);
  u.searchParams.set("destination", destination);
  if (waypoints.length) u.searchParams.set("waypoints", waypoints.join("|"));
  if (travelmode) u.searchParams.set("travelmode", travelmode);
  return u.toString();
}

/** The embedded map on the home and city pages (existing iframe embed). */
export function mapsEmbedUrl(q: string) {
  const u = new URL("https://www.google.com/maps");
  u.searchParams.set("q", q);
  u.searchParams.set("output", "embed");
  return u.toString();
}

/** Publisher icons on news cards (Google's favicon service). */
export function faviconUrl(host: string, size = 32) {
  const u = new URL("https://www.google.com/s2/favicons");
  u.searchParams.set("domain", host);
  u.searchParams.set("sz", String(size));
  return u.toString();
}
