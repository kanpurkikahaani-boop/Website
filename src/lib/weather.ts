"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";

export interface WeatherData {
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    code: number;
    /** Local observation time from Open-Meteo, e.g. "2026-11-03T14:15" (IST). */
    time?: string;
  };
  daily: {
    date: string;
    code: number;
    max: number;
    min: number;
    /** Highest chance of rain during the day, % */
    rainChance?: number;
    sunrise?: string;
    sunset?: string;
    uvMax?: number;
  }[];
  /** Next 24 hours from the current hour. */
  hourly: { time: string; temp: number; rainChance: number; code: number }[];
  fetchedAt: number;
}

type State =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "success"; data: WeatherData; error?: undefined }
  | { status: "error"; data?: undefined; error: string };

const CACHE_MS = 30 * 60 * 1000;
/** Bump when WeatherData changes shape, so old session caches are ignored. */
const CACHE_VERSION = "v2";
const memoryCache = new Map<string, WeatherData>();
const inflight = new Map<string, Promise<WeatherData>>();

export function weatherUrl(lat: number, lon: number) {
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&hourly=temperature_2m,precipitation_probability,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max` +
    `&forecast_days=7&timezone=Asia%2FKolkata`
  );
}

interface OpenMeteoResponse {
  current: {
    time?: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: (number | null)[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: (number | null)[];
  };
}

/** Convert an Open-Meteo response (timezone Asia/Kolkata) into our shape. Exported for tests. */
export function parseOpenMeteo(json: OpenMeteoResponse, fetchedAt = Date.now()): WeatherData {
  const nowHour = (json.current.time ?? "").slice(0, 13); // "YYYY-MM-DDTHH"
  const hours = json.hourly;
  let start = hours ? hours.time.findIndex((t) => t.slice(0, 13) >= nowHour) : -1;
  if (start < 0) start = 0;
  return {
    current: {
      temperature: json.current.temperature_2m,
      apparentTemperature: json.current.apparent_temperature,
      humidity: json.current.relative_humidity_2m,
      windSpeed: json.current.wind_speed_10m,
      code: json.current.weather_code,
      time: json.current.time,
    },
    daily: json.daily.time.map((date, i) => ({
      date,
      code: json.daily.weather_code[i],
      max: json.daily.temperature_2m_max[i],
      min: json.daily.temperature_2m_min[i],
      rainChance: json.daily.precipitation_probability_max?.[i] ?? undefined,
      sunrise: json.daily.sunrise?.[i],
      sunset: json.daily.sunset?.[i],
      uvMax: json.daily.uv_index_max?.[i] ?? undefined,
    })),
    hourly: hours
      ? hours.time.slice(start, start + 24).map((time, k) => ({
          time,
          temp: hours.temperature_2m[start + k],
          rainChance: hours.precipitation_probability[start + k] ?? 0,
          code: hours.weather_code[start + k],
        }))
      : [],
    fetchedAt,
  };
}

function readCache(key: string): WeatherData | undefined {
  key = `${CACHE_VERSION}:${key}`;
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.fetchedAt < CACHE_MS) return mem;
  try {
    const raw = sessionStorage.getItem(`kkk-weather:${key}`);
    if (raw) {
      const parsed = JSON.parse(raw) as WeatherData;
      if (Date.now() - parsed.fetchedAt < CACHE_MS) {
        memoryCache.set(key, parsed);
        return parsed;
      }
    }
  } catch {
    // storage unavailable (private mode) — ignore
  }
  return undefined;
}

/**
 * `ephemeral`: the visitor's own location — kept in memory only, never written to browser
 * storage (no coordinates are stored), and never sent anywhere except to Open-Meteo.
 */
async function fetchWeather(lat: number, lon: number, ephemeral = false): Promise<WeatherData> {
  const key = `${lat},${lon}`;
  const cached = readCache(key);
  if (cached) return cached;
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async () => {
    const res = await fetch(weatherUrl(lat, lon));
    if (!res.ok) throw new Error(`Weather service responded ${res.status}`);
    const data = parseOpenMeteo((await res.json()) as OpenMeteoResponse);
    memoryCache.set(`${CACHE_VERSION}:${key}`, data);
    if (!ephemeral) try {
      sessionStorage.setItem(`kkk-weather:${CACHE_VERSION}:${key}`, JSON.stringify(data));
    } catch {
      // ignore
    }
    return data;
  })();

  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

/** Shared weather hook used by the home info strip, /weather and the city pages. */
export function useWeather(lat: number, lon: number, opts: { ephemeral?: boolean } = {}): State & { retry: () => void } {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const cached = readCache(`${lat},${lon}`);
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from external cache
      setState({ status: "success", data: cached });
      return;
    }
    setState({ status: "loading" });
    fetchWeather(lat, lon, opts.ephemeral)
      .then((data) => !cancelled && setState({ status: "success", data }))
      .catch((e: unknown) =>
        !cancelled &&
        setState({ status: "error", error: e instanceof Error ? e.message : "Weather unavailable" }),
      );
    return () => {
      cancelled = true;
    };
  }, [lat, lon, attempt, opts.ephemeral]);

  return { ...state, retry: () => setAttempt((a) => a + 1) };
}

/** WMO weather interpretation codes → label + icon. */
export function describeWeather(code: number): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Clear sky", Icon: Sun };
  if (code === 1) return { label: "Mainly clear", Icon: CloudSun };
  if (code === 2) return { label: "Partly cloudy", Icon: CloudSun };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if (code === 45 || code === 48) return { label: code === 48 ? "Rime fog" : "Fog", Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Drizzle", Icon: CloudDrizzle };
  if (code >= 61 && code <= 67) return { label: code >= 65 ? "Heavy rain" : "Rain", Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Snow", Icon: CloudSnow };
  if (code >= 80 && code <= 82) return { label: "Rain showers", Icon: CloudRain };
  if (code === 85 || code === 86) return { label: "Snow showers", Icon: CloudSnow };
  if (code >= 95) return { label: "Thunderstorm", Icon: CloudLightning };
  return { label: "Fair", Icon: CloudSun };
}
