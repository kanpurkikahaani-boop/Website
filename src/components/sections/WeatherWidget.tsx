"use client";

import { Droplets, RefreshCw, Wind } from "lucide-react";
import { describeWeather, useWeather } from "@/lib/weather";
import { cn } from "@/lib/utils";

/** Dark "current conditions" card used on /weather and (compact) on city pages. */
export function WeatherWidget({
  lat,
  lon,
  place,
  compact,
}: {
  lat: number;
  lon: number;
  place: string;
  compact?: boolean;
}) {
  const w = useWeather(lat, lon);

  return (
    <div
      className={cn("relative overflow-hidden rounded-3xl bg-dark text-cream", compact ? "p-6" : "p-7 md:p-9")}
      aria-busy={w.status === "loading"}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(200,144,46,0.45), transparent 70%)" }}
      />
      {w.status === "loading" && (
        <div className="relative flex items-center gap-5" aria-label={`Loading weather for ${place}`}>
          <div className="h-16 w-16 animate-pulse rounded-full bg-cream/15" />
          <div className="space-y-3">
            <div className="h-10 w-28 animate-pulse rounded bg-cream/15" />
            <div className="h-4 w-44 animate-pulse rounded bg-cream/10" />
          </div>
        </div>
      )}
      {w.status === "error" && (
        <div className="relative">
          <p className="font-display text-xl text-white">We couldn&apos;t reach the weather service.</p>
          <p className="mt-1 text-sm text-cream/75">
            Check your connection and try again — {place} is usually {hint()}.
          </p>
          <button
            type="button"
            onClick={w.retry}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-cream/40 px-4 py-2 text-sm font-semibold text-white hover:border-accent hover:text-accent"
          >
            <RefreshCw size={15} aria-hidden /> Try again
          </button>
        </div>
      )}
      {w.status === "success" && <Current data={w.data} compact={compact} place={place} />}
    </div>
  );
}

function hint() {
  const m = new Date().getMonth();
  if (m >= 3 && m <= 5) return `hot and dry this time of year (often 38–45°C by afternoon)`;
  if (m >= 6 && m <= 8) return `warm and humid with monsoon showers`;
  return `pleasant by day and cool in the evenings`;
}

function Current({ data, compact, place }: { data: NonNullable<ReturnType<typeof useWeather>["data"]>; compact?: boolean; place: string }) {
  const { label, Icon } = describeWeather(data.current.code);
  return (
    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-5">
        <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-accent text-dark", compact ? "h-14 w-14" : "h-20 w-20")}>
          <Icon size={compact ? 28 : 40} aria-hidden />
        </span>
        <div>
          <p className="sr-only">Current weather in {place}:</p>
          <p className={cn("font-display font-bold leading-none text-white", compact ? "text-5xl" : "text-6xl md:text-7xl")}>
            {Math.round(data.current.temperature)}°C
          </p>
          <p className="mt-2 text-sm text-cream/80">
            {label} · Feels like {Math.round(data.current.apparentTemperature)}°C
          </p>
        </div>
      </div>
      <dl className="flex gap-6 sm:flex-col sm:gap-3 sm:text-right">
        <div className="flex items-center gap-2 sm:justify-end">
          <Droplets size={17} className="text-accent" aria-hidden />
          <dt className="text-sm text-cream/70">Humidity</dt>
          <dd className="font-semibold text-white">{Math.round(data.current.humidity)}%</dd>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <Wind size={17} className="text-accent" aria-hidden />
          <dt className="text-sm text-cream/70">Wind</dt>
          <dd className="font-semibold text-white">{Math.round(data.current.windSpeed)} km/h</dd>
        </div>
      </dl>
    </div>
  );
}

/** 7-day forecast row. */
export function ForecastRow({ lat, lon, compact }: { lat: number; lon: number; compact?: boolean }) {
  const w = useWeather(lat, lon);
  if (w.status === "error") return null;
  const days = w.status === "success" ? w.data.daily.slice(0, 7) : Array.from({ length: 7 }, () => null);
  return (
    <ul
      aria-label="7-day forecast"
      className={cn(
        "scrollbar-none -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2",
        !compact && "md:mx-0 md:grid md:grid-cols-7 md:overflow-visible md:px-0",
      )}
    >
      {days.map((d, i) => {
        if (!d) {
          return <li key={i} className="h-36 min-w-[112px] animate-pulse rounded-2xl border border-border bg-surface" />;
        }
        const { label, Icon } = describeWeather(d.code);
        return (
          <li key={d.date} className="min-w-[104px] shrink-0 snap-start rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="eyebrow text-[10.5px]">{dayLabel(d.date, i)}</p>
            <Icon size={30} className="mx-auto mt-3 text-accent" aria-label={label} />
            <p className="mt-3 text-lg font-bold text-ink">{Math.round(d.max)}°</p>
            <p className="text-sm text-muted">{Math.round(d.min)}°</p>
          </li>
        );
      })}
    </ul>
  );
}

function dayLabel(iso: string, i: number) {
  if (i === 0) return "Today";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${dt.toLocaleDateString("en-IN", { weekday: "short" })} ${dt.getDate()} ${dt.toLocaleDateString("en-IN", { month: "short" })}`;
}
