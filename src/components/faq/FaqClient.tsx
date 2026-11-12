"use client";

import { Link2 } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { describeWeather, useWeather } from "@/lib/weather";
import { getSelectedPlace, subscribeSelectedPlace, type WeatherPlace } from "@/lib/weather-place";
import type { LiveToken } from "@/data/faqs";

/** Small "copy link" icon inside a question; copies the #faq-… deep link without toggling the item. */
export function CopyFaqLink({ anchor, question }: { anchor: string; question: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={done ? "Link copied" : `Copy link to “${question}”`}
      title={done ? "Link copied" : "Copy link"}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${location.origin}${location.pathname}${location.search}#${anchor}`;
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          history.replaceState(null, "", `#${anchor}`);
        }
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className="faq-copy inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted opacity-0 transition hover:bg-primary-soft hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral group-hover/faq:opacity-100"
    >
      <Link2 size={14} aria-hidden />
      <span aria-live="polite" className="sr-only">{done ? "Link copied" : ""}</span>
    </button>
  );
}

/** Opens and scrolls to the FAQ item named in the URL hash (#faq-…), on load and on hash change. */
export function FaqHashOpener() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id.startsWith("faq-")) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}

const round = (n: number) => Math.round(n);

/**
 * Live weather line under a static FAQ answer ("Right now in Kanpur: 29°C, partly cloudy · …").
 * Never part of the JSON-LD. Skeleton while loading; renders nothing if the fetch fails.
 * `follow`: track the place selected on /weather (city pill or "Use my location").
 */
export function LiveFaqLine({ token, place, follow = false }: { token: LiveToken; place: WeatherPlace; follow?: boolean }) {
  const selected = useSyncExternalStore(subscribeSelectedPlace, getSelectedPlace, () => null);
  const p = (follow && selected) || place;
  const w = useWeather(p.lat, p.lon, { ephemeral: p.ephemeral });
  if (w.status === "error") return null;
  if (w.status === "loading") return <span aria-hidden className="mt-3 block h-5 w-64 max-w-full animate-pulse rounded bg-border/70" />;
  const d = w.data;
  const today = d.daily[0];
  const tomorrow = d.daily[1];
  const rain = (n?: number) => (n === undefined ? "" : ` · ${round(n)}% chance of rain`);
  let text = "";
  switch (token) {
    case "currentTemp":
      text = `Right now in ${p.label}: ${round(d.current.temperature)}°C (feels like ${round(d.current.apparentTemperature)}°C), ${describeWeather(d.current.code).label.toLowerCase()}`;
      break;
    case "todaySummary":
      text = `Today in ${p.label}: ${describeWeather(today?.code ?? d.current.code).label.toLowerCase()}, ${round(today.min)}–${round(today.max)}°C${rain(today.rainChance)}`;
      break;
    case "tomorrowSummary":
      if (!tomorrow) return null;
      text = `Tomorrow in ${p.label}: ${describeWeather(tomorrow.code).label.toLowerCase()}, ${round(tomorrow.min)}–${round(tomorrow.max)}°C${rain(tomorrow.rainChance)}`;
      break;
    case "rainChanceToday":
      if (today?.rainChance === undefined) return null;
      text = `Today in ${p.label}: ${round(today.rainChance)}% chance of rain at its highest, ${describeWeather(today.code).label.toLowerCase()}`;
      break;
    case "rainChanceTomorrow":
      if (tomorrow?.rainChance === undefined) return null;
      text = `Tomorrow in ${p.label}: ${round(tomorrow.rainChance)}% chance of rain at its highest, ${describeWeather(tomorrow.code).label.toLowerCase()}`;
      break;
  }
  return (
    <span data-live-line className="mt-3 flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2 text-[14px] font-medium text-ink">
      <span aria-hidden className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#21a05a]" />
      {text}.
    </span>
  );
}
