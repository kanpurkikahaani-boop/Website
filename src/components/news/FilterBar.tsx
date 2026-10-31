"use client";

import { useRef } from "react";
import { CITY_LABELS, GENRES, NEWS_CITIES } from "@/lib/news/taxonomy";
import { cn } from "@/lib/utils";

/**
 * GET form → every filter combination is a plain, shareable, crawlable URL (/news?city=…&genre=…).
 * Works without JavaScript; with JS, selects and the language toggle submit immediately.
 */
export function FilterBar({ city, genre, lang }: { city: string; genre: string; lang: string }) {
  const form = useRef<HTMLFormElement>(null);
  const submit = () => form.current?.requestSubmit();
  return (
    <form ref={form} action="/news" method="get" role="search" aria-label="Filter news" className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[220px_260px_auto_auto] lg:items-end">
      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">
        City
        <select name="city" defaultValue={city} onChange={submit} className="h-11 rounded-full border border-border bg-bg px-4 text-sm font-medium normal-case tracking-normal text-ink focus:border-primary">
          <option value="">All cities</option>
          {NEWS_CITIES.map((c) => <option key={c} value={c}>{CITY_LABELS[c].en}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">
        Genre
        <select name="genre" defaultValue={genre} onChange={submit} className="h-11 rounded-full border border-border bg-bg px-4 text-sm font-medium normal-case tracking-normal text-ink focus:border-primary">
          <option value="">All</option>
          {GENRES.map((g) => <option key={g.slug} value={g.slug}>{g.label}</option>)}
        </select>
      </label>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">Language</legend>
        <div className="flex h-11 rounded-full border border-border bg-bg p-1">
          {[{ v: "", l: "All" }, { v: "en", l: "English" }, { v: "hi", l: "हिंदी" }].map((o) => (
            <label key={o.v} className={cn("flex cursor-pointer items-center rounded-full px-3.5 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral", lang === o.v ? "bg-primary text-white" : "text-ink hover:text-primary", o.v === "hi" && "font-deva")}>
              <input type="radio" name="lang" value={o.v} defaultChecked={lang === o.v} onChange={submit} className="sr-only" />
              {o.l}
            </label>
          ))}
        </div>
      </fieldset>
      <noscript>
        <button className="h-11 self-end rounded-full bg-primary px-5 text-sm font-semibold text-white">Apply</button>
      </noscript>
    </form>
  );
}
