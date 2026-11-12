"use client";

import { Droplets, Sun, Sunrise, Sunset, Thermometer, Umbrella, Wind } from "lucide-react";
import type { ReactNode } from "react";
import { describeWeather, useWeather, type WeatherData } from "@/lib/weather";
import { cn } from "@/lib/utils";

interface PlaceProps {
  lat: number;
  lon: number;
  place: string;
  ephemeral?: boolean;
}

const hhmm = (iso?: string) => {
  if (!iso) return "—";
  const t = iso.split("T")[1] ?? "";
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return "—";
  const ampm = h >= 12 ? "pm" : "am";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ampm}`;
};
const hourLabel = (iso: string, i: number) => {
  if (i === 0) return "Now";
  const h = Number(iso.split("T")[1]?.slice(0, 2));
  return `${((h + 11) % 12) + 1} ${h >= 12 ? "pm" : "am"}`;
};
const uvBand = (uv?: number) => (uv === undefined ? "" : uv < 3 ? "Low" : uv < 6 ? "Moderate" : uv < 8 ? "High" : uv < 11 ? "Very high" : "Extreme");

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl border border-border bg-surface", className)} />;
}

/** Today at a glance: high/low, rain chance, sunrise/sunset, UV, humidity, wind, feels like. */
export function TodayStrip({ lat, lon, place, ephemeral }: PlaceProps) {
  const w = useWeather(lat, lon, { ephemeral });
  if (w.status === "error") return null;
  if (w.status === "loading") return <Skeleton className="h-28" />;
  const d = w.data.daily[0];
  const c = w.data.current;
  const items: { icon: ReactNode; label: string; value: string }[] = [
    { icon: <Thermometer size={18} />, label: "High / low", value: `${Math.round(d.max)}° / ${Math.round(d.min)}°C` },
    { icon: <Umbrella size={18} />, label: "Chance of rain", value: d.rainChance !== undefined ? `${Math.round(d.rainChance)}%` : "—" },
    { icon: <Sunrise size={18} />, label: "Sunrise", value: hhmm(d.sunrise) },
    { icon: <Sunset size={18} />, label: "Sunset", value: hhmm(d.sunset) },
    { icon: <Sun size={18} />, label: "UV index", value: d.uvMax !== undefined ? `${Math.round(d.uvMax)} ${uvBand(d.uvMax)}` : "—" },
    { icon: <Droplets size={18} />, label: "Humidity", value: `${Math.round(c.humidity)}%` },
    { icon: <Wind size={18} />, label: "Wind", value: `${Math.round(c.windSpeed)} km/h` },
    { icon: <Thermometer size={18} />, label: "Feels like", value: `${Math.round(c.apparentTemperature)}°C` },
  ];
  return (
    <dl aria-label={`Today in ${place}`} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-border bg-surface px-4 py-3">
          <dt className="flex items-center gap-2 text-[13px] text-muted">
            <span className="text-accent-ink" aria-hidden>
              {it.icon}
            </span>
            {it.label}
          </dt>
          <dd className="mt-1 text-lg font-bold text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Next 24 hours, scrollable. */
export function HourlyRow({ lat, lon, ephemeral }: PlaceProps) {
  const w = useWeather(lat, lon, { ephemeral });
  if (w.status === "error") return null;
  const hours = w.status === "success" ? w.data.hourly.slice(0, 24) : Array.from({ length: 12 }, () => null);
  return (
    <ul aria-label="Hourly forecast for the next 24 hours" tabIndex={0} className="scrollbar-none -mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral md:mx-0 md:px-0">
      {hours.map((h, i) => {
        if (!h) return <li key={i} className="h-32 min-w-[76px] animate-pulse rounded-2xl border border-border bg-surface" />;
        const { label, Icon } = describeWeather(h.code);
        return (
          <li key={h.time} className="min-w-[76px] shrink-0 snap-start rounded-2xl border border-border bg-surface px-3 py-3 text-center">
            <p className="text-[12px] font-semibold text-muted">{hourLabel(h.time, i)}</p>
            <Icon size={24} className="mx-auto mt-2 text-accent" aria-label={label} />
            <p className="mt-2 font-bold text-ink">{Math.round(h.temp)}°</p>
            <p className="mt-0.5 flex items-center justify-center gap-0.5 text-[12px] text-[#2c6e9b]">
              <Droplets size={11} aria-hidden />
              <span className="sr-only">Chance of rain </span>
              {Math.round(h.rainChance)}%
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** Tomorrow in {place}. */
export function TomorrowCard({ lat, lon, place, ephemeral }: PlaceProps) {
  const w = useWeather(lat, lon, { ephemeral });
  if (w.status === "error") return null;
  if (w.status === "loading") return <Skeleton className="h-36" />;
  const d = w.data.daily[1];
  if (!d) return null;
  const { label, Icon } = describeWeather(d.code);
  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between md:p-7">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-ink">
          <Icon size={30} aria-hidden />
        </span>
        <div>
          <p className="eyebrow">Tomorrow in {place}</p>
          <p className="mt-1 text-xl font-semibold text-ink">{label}</p>
        </div>
      </div>
      <dl className="flex flex-wrap justify-between gap-x-6 gap-y-3 sm:justify-start sm:gap-8">
        <div>
          <dt className="text-[13px] text-muted">High / low</dt>
          <dd className="whitespace-nowrap text-lg font-bold text-ink">
            {Math.round(d.max)}° / {Math.round(d.min)}°C
          </dd>
        </div>
        <div>
          <dt className="whitespace-nowrap text-[13px] text-muted">Rain chance</dt>
          <dd className="text-lg font-bold text-ink">{d.rainChance !== undefined ? `${Math.round(d.rainChance)}%` : "—"}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">Sunrise</dt>
          <dd className="whitespace-nowrap text-lg font-bold text-ink">{hhmm(d.sunrise)}</dd>
        </div>
      </dl>
    </div>
  );
}

/** "Last updated 2:15 pm IST · refreshes every 30 minutes". */
export function LastUpdated({ lat, lon, ephemeral }: Omit<PlaceProps, "place">) {
  const w = useWeather(lat, lon, { ephemeral });
  if (w.status !== "success") return null;
  return <span>Last updated {istTime(w.data)} IST · refreshes every 30 minutes</span>;
}

function istTime(d: WeatherData) {
  return new Date(d.fetchedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
}
