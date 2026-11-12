"use client";

import dynamic from "next/dynamic";
import { LocateFixed } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { ForecastRow, WeatherWidget } from "@/components/sections/WeatherWidget";
import { HourlyRow, LastUpdated, TodayStrip, TomorrowCard } from "@/components/weather/WeatherDetails";
import { useQueryState } from "@/lib/url-state";
import { setSelectedPlace, type WeatherPlace } from "@/lib/weather-place";
import { cn } from "@/lib/utils";

const RainRadar = dynamic(() => import("@/components/weather/RainRadar"), {
  ssr: false,
  loading: () => <div className="h-[340px] animate-pulse rounded-3xl border border-border bg-surface md:h-[440px]" />,
});

export interface WeatherCity {
  value: string;
  label: string;
  lat: number;
  lon: number;
}

const IMD = "https://mausam.imd.gov.in";
/** Only the visitor's *choice* is remembered — never coordinates. */
const PREF_KEY = "kkk-weather-use-location";
const round = (n: number) => Math.round(n * 100) / 100; // ~1 km: plenty for a forecast

/** City selector / "Use my location" + current conditions, today, hourly, tomorrow, 7 days and radar. */
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

type LocState = { status: "idle" } | { status: "locating" } | { status: "on"; place: WeatherPlace } | { status: "denied"; message: string };

function View({ cities, value, onChange }: { cities: WeatherCity[]; value: string; onChange?: (v: string) => void }) {
  const city = cities.find((x) => x.value === value) ?? cities[0];
  const [loc, setLoc] = useState<LocState>({ status: "idle" });
  const [usedBefore, setUsedBefore] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setUsedBefore(localStorage.getItem(PREF_KEY) === "1");
      } catch {
        // storage blocked: fine
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const place: WeatherPlace = loc.status === "on" ? loc.place : { lat: city.lat, lon: city.lon, label: city.label };
  useEffect(() => {
    setSelectedPlace(place);
  }, [place.lat, place.lon, place.label, place.ephemeral]); // eslint-disable-line react-hooks/exhaustive-deps

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setLoc({ status: "denied", message: "Your browser can't share a location, so we're showing Kanpur." });
      onChange?.("kanpur");
      return;
    }
    setLoc({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = round(pos.coords.latitude);
        const lon = round(pos.coords.longitude);
        setLoc({ status: "on", place: { lat, lon, label: "Your location", ephemeral: true } });
        try {
          localStorage.setItem(PREF_KEY, "1");
        } catch {
          // ignore
        }
        const name = await placeName(lat, lon);
        if (name) setLoc((s) => (s.status === "on" && s.place.lat === lat && s.place.lon === lon ? { status: "on", place: { ...s.place, label: name } } : s));
      },
      (err) => {
        try {
          localStorage.removeItem(PREF_KEY);
        } catch {
          // ignore
        }
        setUsedBefore(false);
        setLoc({
          status: "denied",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location access is off, so we're showing Kanpur. You can allow it in your browser's site settings and try again."
              : "We couldn't find your location just now, so we're showing Kanpur.",
        });
        onChange?.("kanpur");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  };

  const pick = (v: string) => {
    setLoc({ status: "idle" });
    onChange?.(v);
  };

  const mine = loc.status === "on";
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <FilterPills label="Choose a city" options={cities} value={mine ? "" : value} onChange={pick} size="sm" />
        <button
          type="button"
          onClick={useMyLocation}
          aria-pressed={mine}
          disabled={loc.status === "locating"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral",
            mine ? "border-primary bg-primary text-white" : "border-border bg-white text-ink hover:border-primary hover:text-primary",
          )}
        >
          <LocateFixed size={15} aria-hidden />
          {loc.status === "locating" ? "Finding you…" : "Use my location"}
          {usedBefore && !mine && loc.status !== "locating" && <span className="sr-only"> (used last time)</span>}
        </button>
      </div>
      <p role="status" className={cn("-mt-4 mb-6 text-sm", loc.status === "denied" ? "text-primary" : "sr-only")}>
        {loc.status === "denied" ? loc.message : mine ? `Showing the weather at ${place.label}.` : ""}
      </p>

      <p className="eyebrow mb-3">Right now in {place.label}</p>
      <WeatherWidget key={`${place.lat},${place.lon}`} lat={place.lat} lon={place.lon} place={place.label} ephemeral={place.ephemeral} />

      <section id="today" aria-labelledby="today-title" className="mt-10 scroll-mt-28">
        <h2 id="today-title" className="mb-4 text-[22px] font-bold text-primary md:text-[26px]">
          Today in {place.label}
        </h2>
        <TodayStrip lat={place.lat} lon={place.lon} place={place.label} ephemeral={place.ephemeral} />
      </section>

      <section id="hourly" aria-labelledby="hourly-title" className="mt-10 scroll-mt-28">
        <h2 id="hourly-title" className="mb-4 text-[22px] font-bold text-primary md:text-[26px]">
          Next 24 hours
        </h2>
        <HourlyRow lat={place.lat} lon={place.lon} place={place.label} ephemeral={place.ephemeral} />
      </section>

      <section id="tomorrow" aria-labelledby="tomorrow-title" className="mt-10 scroll-mt-28">
        <h2 id="tomorrow-title" className="sr-only">
          Tomorrow
        </h2>
        <TomorrowCard lat={place.lat} lon={place.lon} place={place.label} ephemeral={place.ephemeral} />
      </section>

      <section id="week" aria-labelledby="week-title" className="mt-12 scroll-mt-28">
        <h2 id="week-title" className="mb-5 text-[22px] font-bold text-primary md:text-[26px]">
          7-day forecast
        </h2>
        <ForecastRow key={`f-${place.lat},${place.lon}`} lat={place.lat} lon={place.lon} ephemeral={place.ephemeral} />
        <p className="mt-4 text-xs">
          <LastUpdated lat={place.lat} lon={place.lon} ephemeral={place.ephemeral} />
          {" · "}Data:{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            Open-Meteo
          </a>
        </p>
        <p className="mt-3 rounded-xl border border-border bg-bg-alt px-4 py-3 text-sm">
          For official weather warnings — heatwaves, cold waves, fog and heavy rain — see the{" "}
          <a href={IMD} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
            India Meteorological Department (IMD) ↗<span className="sr-only"> (opens in new tab)</span>
          </a>
          .
        </p>
      </section>

      <section id="radar" aria-labelledby="radar-title" className="mt-12 scroll-mt-28">
        <h2 id="radar-title" className="mb-2 text-[22px] font-bold text-primary md:text-[26px]">
          Live rain radar
        </h2>
        <p className="mb-4 text-sm">Rain and showers around {place.label} over roughly the last two hours.</p>
        <LazyRadar place={place} />
      </section>
    </>
  );
}

function LazyRadar({ place }: { place: WeatherPlace }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      const t = setTimeout(() => setNear(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref}>
      {failed ? (
        <p className="rounded-2xl border border-border bg-surface p-5 text-sm">
          The live radar couldn&apos;t load just now. See the official radar images from the{" "}
          <a href={IMD} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
            India Meteorological Department ↗<span className="sr-only"> (opens in new tab)</span>
          </a>
          .
        </p>
      ) : near ? (
        <RainRadar lat={place.lat} lon={place.lon} place={place.label} onFail={() => setFailed(true)} />
      ) : (
        <div className="h-[340px] rounded-3xl border border-border bg-surface md:h-[440px]" />
      )}
    </div>
  );
}

/**
 * Place name for the visitor's rounded coordinates, looked up from their browser with
 * BigDataCloud's free client-side reverse-geocoding endpoint (no key). Never sent to our servers.
 * Falls back to "Your location". // VERIFY terms (SETUP.md → Weather).
 */
async function placeName(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (!r.ok) return null;
    const j = (await r.json()) as { city?: string; locality?: string; principalSubdivision?: string };
    const name = j.city || j.locality;
    return name ? name.slice(0, 60) : null;
  } catch {
    return null;
  }
}
