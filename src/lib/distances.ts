import { cities, kanpurInfo } from "@/data/cities";

/** When the distance guide's figures were last reviewed (shown on the page, in the CSV and JSON-LD). */
export const DISTANCES_UPDATED = "2026-11-16";
export const DISTANCES_PATH = "/guides/distances-from-kanpur";
export const DISTANCES_TITLE = "Distances from Kanpur: Lucknow, Agra, Prayagraj, Varanasi & Ayodhya";

/** Great-circle ("as the crow flies") distance between city-centre coordinates, km. */
export function straightLineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export const distanceRows = () =>
  [...cities]
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map((c) => ({
      city: c,
      straightKm: straightLineKm(kanpurInfo, c),
      roadKm: c.distanceKm,
      drive: c.driveTime,
      train: c.trainTime,
      fastest: c.fastestWay,
      airport: c.nearestAirport,
      bestTime: c.bestTime,
    }));
