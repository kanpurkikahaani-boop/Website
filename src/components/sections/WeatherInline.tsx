"use client";

import { describeWeather, useWeather } from "@/lib/weather";

/** Compact "31°C · Clear sky" text with skeleton and fallback, for info strips. */
export function WeatherInline({ lat, lon }: { lat: number; lon: number }) {
  const w = useWeather(lat, lon);
  if (w.status === "loading") {
    return <span className="inline-block h-4 w-28 animate-pulse rounded bg-cream/20 align-middle" aria-label="Loading weather" />;
  }
  if (w.status === "error") {
    return <span className="text-cream/70">Weather unavailable right now</span>;
  }
  const { label } = describeWeather(w.data.current.code);
  return (
    <span>
      {Math.round(w.data.current.temperature)}°C · {label}
    </span>
  );
}
