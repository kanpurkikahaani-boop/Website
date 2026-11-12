/**
 * The place currently selected on /weather (a city pill or "Use my location"), shared with the
 * live FAQ lines further down the page. In-memory only — coordinates are never stored.
 */
export interface WeatherPlace {
  lat: number;
  lon: number;
  label: string;
  /** The visitor's own location: never cached in browser storage. */
  ephemeral?: boolean;
}

let selected: WeatherPlace | null = null;
const listeners = new Set<() => void>();

export function setSelectedPlace(p: WeatherPlace) {
  selected = p;
  listeners.forEach((l) => l());
}
export const getSelectedPlace = () => selected;
export function subscribeSelectedPlace(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
