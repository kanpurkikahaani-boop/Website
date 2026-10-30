import { cities } from "@/data/cities";

export const CITY_OPTIONS = [
  { slug: "kanpur", name: "Kanpur" },
  ...cities.map((c) => ({ slug: c.slug as string, name: c.name })),
];

export function cityName(slug?: string | null) {
  return CITY_OPTIONS.find((c) => c.slug === slug)?.name ?? "";
}
