"use client";

import { Suspense } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { ForecastRow, WeatherWidget } from "@/components/sections/WeatherWidget";
import { useQueryState } from "@/lib/url-state";

export interface WeatherCity {
  value: string;
  label: string;
  lat: number;
  lon: number;
}

/** City selector + current conditions + 7-day forecast; selection in `?city=`. */
export function WeatherClient({ cities }: { cities: WeatherCity[] }) {
  return (
    <Suspense fallback={<View cities={cities} value="kanpur" />}>
      <WithQuery cities={cities} />
    </Suspense>
  );
}

function WithQuery({ cities }: { cities: WeatherCity[] }) {
  const [value, setValue] = useQueryState("city", cities.map((c) => c.value), "kanpur");
  return <View cities={cities} value={value} onChange={setValue} />;
}

function View({ cities, value, onChange }: { cities: WeatherCity[]; value: string; onChange?: (v: string) => void }) {
  const c = cities.find((x) => x.value === value) ?? cities[0];
  return (
    <>
      <FilterPills label="Choose a city" options={cities} value={value} onChange={onChange ?? (() => {})} className="mb-8" size="sm" />
      <p className="eyebrow mb-3">Right now in {c.label}</p>
      <WeatherWidget key={c.value} lat={c.lat} lon={c.lon} place={c.label} />
      <h2 className="mt-12 mb-5 text-[26px] font-bold text-primary md:text-[32px]">7-Day Forecast</h2>
      <ForecastRow key={`f-${c.value}`} lat={c.lat} lon={c.lon} />
      <p className="mt-4 text-xs">
        Data: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Open-Meteo</a> · refreshed every 30 minutes.
      </p>
    </>
  );
}
