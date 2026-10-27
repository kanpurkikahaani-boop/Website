"use client";

import type { City } from "@/data/types";
import { ImageCard } from "@/components/ui/ImageCard";
import { track } from "@/lib/analytics";

/** Nearby-city card with Devanagari name, tagline and distance/time chips. */
export function CityCard({ city, from = "home" }: { city: City; from?: string }) {
  return (
    <ImageCard
      image={city.heroImage}
      alt={city.heroAlt}
      imageLabel={city.name}
      imageSublabel={`~${city.distanceKm} km from Kanpur`}
      eyebrow={city.tagline}
      title={city.name}
      hindi={city.hindi}
      description={city.shortIntro}
      chips={[`~${city.distanceKm} km`, `${city.driveTime} by road`]}
      href={`/cities/${city.slug}`}
      onClick={() => track("city_card_click", { city: city.slug, from })}
    />
  );
}
