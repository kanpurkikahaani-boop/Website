"use client";

import { ArrowUpRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import { Suspense, useSyncExternalStore } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { bookMyShowCityUrls } from "@/data/site";
import { track } from "@/lib/analytics";
import { EVENT_CATEGORIES, categoryLabel } from "@/lib/events-schema";
import { CITY_LABELS, type NewsCity } from "@/lib/news/taxonomy";
import { useQueryState } from "@/lib/url-state";

export interface EventView {
  id: string;
  title: string;
  category: string;
  city: string;
  venue: string;
  startAt: string;
  endAt: string | null;
  bmsUrl: string | null;
  sourceUrl: string | null;
}

const CITY_OPTIONS = [{ value: "all", label: "All" }, ...Object.entries(CITY_LABELS).map(([value, l]) => ({ value, label: l.en }))];
const CATEGORY_OPTIONS = [{ value: "all", label: "All" }, ...EVENT_CATEGORIES.map((c) => ({ value: c.value as string, label: c.label }))];

/** Curated events with city + category filters (`?city=` / `?category=`). Past events never show. */
export function EventList({ events }: { events: EventView[] }) {
  return (
    <Suspense fallback={<View events={events} city="all" category="all" />}>
      <WithQuery events={events} />
    </Suspense>
  );
}

function WithQuery({ events }: { events: EventView[] }) {
  const [city, setCity] = useQueryState("city", CITY_OPTIONS.map((o) => o.value), "all");
  const [category, setCategory] = useQueryState("category", CATEGORY_OPTIONS.map((o) => o.value), "all");
  return <View events={events} city={city} category={category} onCity={setCity} onCategory={setCategory} />;
}

function View({
  events,
  city,
  category,
  onCity,
  onCategory,
}: {
  events: EventView[];
  city: string;
  category: string;
  onCity?: (v: string) => void;
  onCategory?: (v: string) => void;
}) {
  // Belt and braces: in the browser, also hide anything that finished after the page was cached.
  const now = useNowMinute();
  const shown = events
    .filter((e) => !now || new Date(e.endAt ?? e.startAt).getTime() >= now)
    .filter((e) => (city === "all" || e.city === city) && (category === "all" || e.category === category))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const cityName = city !== "all" ? CITY_LABELS[city as NewsCity]?.en : null;

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-8 space-y-3">
        <FilterPills label="Filter events by city" options={CITY_OPTIONS} value={city} onChange={onCity ?? (() => {})} className="justify-center" size="sm" />
        <FilterPills label="Filter events by category" options={CATEGORY_OPTIONS} value={category} onChange={onCategory ?? (() => {})} className="justify-center" size="sm" />
      </div>
      <p className="sr-only" aria-live="polite">
        {shown.length} upcoming events
      </p>
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          No listed events yet
          {cityName ? (
            <>
              {" "}— see what&apos;s on in {cityName} on{" "}
              <a
                href={bookMyShowCityUrls[city as NewsCity]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("bms_city_click", { city, from: "empty_state" })}
                className="font-semibold text-primary underline"
              >
                BookMyShow ↗
              </a>
            </>
          ) : (
            <> — tap a city above to see what&apos;s on today on BookMyShow.</>
          )}
        </p>
      ) : (
        <ul className="space-y-4">
          {shown.map((e) => (
            <li key={e.id}>
              <EventCard event={e} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const noop = () => () => {};
/** Current time (to the minute) in the browser; null during server render (the server already filtered). */
function useNowMinute() {
  return useSyncExternalStore(noop, () => Math.floor(Date.now() / 60000) * 60000, () => null);
}

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });

export function EventCard({ event: e }: { event: EventView }) {
  const day = fmt(e.startAt, { day: "numeric" });
  const month = fmt(e.startAt, { month: "short" });
  const when = e.endAt && fmt(e.endAt, { dateStyle: "medium" }) !== fmt(e.startAt, { dateStyle: "medium" })
    ? `${fmt(e.startAt, { day: "numeric", month: "short" })} – ${fmt(e.endAt, { day: "numeric", month: "short", year: "numeric" })}`
    : fmt(e.startAt, { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
  const city = CITY_LABELS[e.city as NewsCity]?.en ?? e.city;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:shadow-[0_12px_30px_-18px_rgba(60,30,20,0.35)] sm:flex-row sm:items-center sm:p-5">
      <div className="flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft text-primary" aria-hidden>
        <span className="font-display text-3xl font-bold leading-none">{day}</span>
        <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em]">{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-[10.5px]">
          {categoryLabel(e.category)} · {city}
        </p>
        <h3 className="mt-1 text-lg font-semibold leading-snug">{e.title}</h3>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} className="text-accent" aria-hidden />
            <time dateTime={e.startAt}>{when}</time>
          </span>
          {e.venue && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-accent" aria-hidden />
              {e.venue}
            </span>
          )}
        </div>
      </div>
      {e.bmsUrl ? (
        <a
          href={e.bmsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("bms_event_click", { event: e.title, city: e.city })}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover sm:self-center"
        >
          <Ticket size={15} aria-hidden /> Book on BookMyShow
          <ArrowUpRight size={15} aria-hidden />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : e.sourceUrl ? (
        <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex shrink-0 items-center gap-1 self-start text-sm font-semibold text-primary hover:text-primary-hover sm:self-center">
          Details <ArrowUpRight size={15} aria-hidden />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </article>
  );
}
