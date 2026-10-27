"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Suspense } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { stayTiers, bookingUrl } from "@/data/stays";
import type { Stay } from "@/data/types";
import { track } from "@/lib/analytics";
import { useQueryState } from "@/lib/url-state";

type Tier = (typeof stayTiers)[number]["value"];

interface Props {
  stays: Stay[];
  cityOptions: { value: string; label: string }[];
}

const tierLabel: Record<Stay["tier"], string> = { budget: "Budget", "mid-range": "Mid-Range", luxury: "Luxury" };

export function StayList(props: Props) {
  return (
    <Suspense fallback={<View {...props} tier="all" city="kanpur" />}>
      <WithQuery {...props} />
    </Suspense>
  );
}

function WithQuery(props: Props) {
  const [tier, setTier] = useQueryState<Tier>("tier", stayTiers.map((t) => t.value), "all");
  const [city, setCity] = useQueryState("city", props.cityOptions.map((c) => c.value), "kanpur");
  return <View {...props} tier={tier} city={city} onTier={setTier} onCity={setCity} />;
}

function View({
  stays,
  cityOptions,
  tier,
  city,
  onTier,
  onCity,
}: Props & { tier: Tier; city: string; onTier?: (t: Tier) => void; onCity?: (c: string) => void }) {
  const cityName = cityOptions.find((c) => c.value === city)?.label ?? "Kanpur";
  const shown = stays.filter((s) => s.city === city && (tier === "all" || s.tier === tier));

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <FilterPills label="Filter stays by budget" options={[...stayTiers]} value={tier} onChange={onTier ?? (() => {})} />
        <label className="flex items-center gap-3 text-sm font-semibold text-ink">
          City
          <span className="relative">
            <select
              value={city}
              onChange={(e) => onCity?.(e.target.value)}
              className="h-11 appearance-none rounded-full border border-border bg-surface pl-4 pr-10 text-sm font-medium text-ink focus:border-primary"
            >
              {cityOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
          </span>
        </label>
      </div>
      <p className="sr-only" aria-live="polite">
        {shown.length} stays in {cityName}
      </p>
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center">
          No {tier !== "all" ? tierLabel[tier as Stay["tier"]].toLowerCase() : ""} sample stays listed for {cityName} yet — try another budget.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <li key={s.slug} className="flex flex-col rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(60,30,20,0.35)]">
              <p className="eyebrow text-[11px]">{tierLabel[s.tier]}</p>
              <h3 className="mt-1.5 text-xl font-semibold leading-snug">{s.name}</h3>
              <p className="mt-0.5 text-sm font-medium text-ink/80">
                {s.area}, {cityName}
              </p>
              <p className="mt-2 text-sm">{s.description}</p>
              <p className="mt-4 font-display text-xl font-bold text-primary">
                {s.priceRange} <span className="font-sans text-sm font-medium text-muted">/ night</span>
              </p>
              <a
                href={bookingUrl(s, cityName)}
                target="_blank"
                rel="sponsored noopener"
                onClick={() => track("book_stay_click", { stay: s.slug, city: s.city, tier: s.tier })}
                className="group mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-primary hover:text-primary-hover"
              >
                Book this stay
                <ArrowUpRight size={15} aria-hidden className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                <span className="sr-only"> (opens a booking site in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
