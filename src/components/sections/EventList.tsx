"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { Suspense } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { InlineLink } from "@/components/ui/InlineLink";
import type { EventItem } from "@/data/types";
import { useQueryState } from "@/lib/url-state";
import { useToday } from "@/lib/use-today";
import { formatDate, monthShort, parseISODate } from "@/lib/utils";

type CityFilter = "all" | EventItem["city"];

interface Props {
  events: EventItem[];
  cityOptions: { value: CityFilter; label: string }[];
}

/** Centred list of event cards with a city filter (`?city=`). Past events are hidden on the client. */
export function EventList(props: Props) {
  return (
    <Suspense fallback={<View {...props} city="all" />}>
      <WithQuery {...props} />
    </Suspense>
  );
}

function WithQuery(props: Props) {
  const [city, setCity] = useQueryState<CityFilter>(
    "city",
    props.cityOptions.map((o) => o.value),
    "all",
  );
  return <View {...props} city={city} onChange={setCity} />;
}

function View({ events, cityOptions, city, onChange }: Props & { city: CityFilter; onChange?: (c: CityFilter) => void }) {
  const today = useToday();
  const upcoming = events
    .filter((e) => !today || (e.end ?? e.start) >= today)
    .filter((e) => city === "all" || e.city === city)
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="mx-auto max-w-[720px]">
      <FilterPills label="Filter events by city" options={cityOptions} value={city} onChange={onChange ?? (() => {})} className="mb-8 justify-center" size="sm" />
      <p className="sr-only" aria-live="polite">
        {upcoming.length} upcoming events
      </p>
      {upcoming.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center">
          No upcoming events listed for this city yet — check back soon or try &ldquo;All&rdquo;.
        </p>
      ) : (
        <ul className="space-y-4">
          {upcoming.map((e) => (
            <li key={e.slug}>
              <EventCard event={e} cityLabel={cityOptions.find((c) => c.value === e.city)?.label ?? e.city} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EventCard({ event: e, cityLabel }: { event: EventItem; cityLabel: string }) {
  const day = parseISODate(e.start).getDate();
  const dateText = e.end ? `${formatDate(e.start)} – ${formatDate(e.end)}` : formatDate(e.start, { long: true });
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:shadow-[0_12px_30px_-18px_rgba(60,30,20,0.35)] sm:flex-row sm:items-center sm:p-5">
      <div className="flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft text-primary" aria-hidden>
        <span className="font-display text-3xl font-bold leading-none">{day}</span>
        <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em]">{monthShort(e.start)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-[10.5px]">
          {e.category} · {cityLabel}
        </p>
        <h3 className="mt-1 text-lg font-semibold leading-snug">{e.title}</h3>
        <p className="mt-1 text-sm">{e.description}</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} className="text-accent" aria-hidden />
            <time dateTime={e.start}>{dateText}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} className="text-accent" aria-hidden />
            {e.venue}
          </span>
        </div>
      </div>
      <InlineLink
        href={e.url === "#" ? `https://www.google.com/search?q=${encodeURIComponent(`${e.title} ${cityLabel} ${e.start.slice(0, 4)}`)}` : e.url}
        external
        className="shrink-0 self-start sm:self-center"
      >
        Details
      </InlineLink>
    </article>
  );
}
