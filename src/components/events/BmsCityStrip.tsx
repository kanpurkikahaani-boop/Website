"use client";

import { ArrowUpRight, Ticket } from "lucide-react";
import { bookMyShowCityUrls } from "@/data/site";
import { track } from "@/lib/analytics";
import { CITY_LABELS, NEWS_CITIES } from "@/lib/news/taxonomy";

/** Six always-current BookMyShow city pages (BookMyShow maintains them; we only link out). */
export function BmsCityStrip() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {NEWS_CITIES.map((c) => (
        <li key={c} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
          <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f84464]/10 text-[#c8153f]">
            <Ticket size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold leading-tight text-ink">
              {CITY_LABELS[c].en}
              <span lang="hi" className="ml-2 font-deva text-sm font-medium text-primary">
                {CITY_LABELS[c].hi}
              </span>
            </p>
            <a
              href={bookMyShowCityUrls[c]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("bms_city_click", { city: c })}
              className="group mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
            >
              See what&apos;s on in {CITY_LABELS[c].en}
              <ArrowUpRight size={15} aria-hidden className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              <span className="sr-only"> on BookMyShow (opens in a new tab)</span>
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
