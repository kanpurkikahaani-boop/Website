"use client";

import { Search } from "lucide-react";
import { useRef } from "react";
import { CITY_LABELS, GENRES, NEWS_CITIES } from "@/lib/news/taxonomy";
import { cn } from "@/lib/utils";

/**
 * GET form → every filter combination is a plain, shareable, crawlable URL (/news?city=…&genre=…).
 * Works without JavaScript; with JS, selects and the language toggle submit immediately.
 */
export function FilterBar({ city, genre, lang, q }: { city: string; genre: string; lang: string; q: string }) {
  const form = useRef<HTMLFormElement>(null);
  const submit = () => form.current?.requestSubmit();
  return (
    <form ref={form} action="/news" method="get" role="search" aria-label="Filter news" className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm md:grid-cols-[1fr_1fr_auto] lg:grid-cols-[180px_220px_auto_1fr]">
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
      <div className="flex flex-col gap-1 md:col-span-3 lg:col-span-1">
        <label htmlFor="news-q" className="text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">Search</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input id="news-q" name="q" defaultValue={q} placeholder="Search headlines" className="h-11 w-full rounded-full border border-border bg-bg pl-10 pr-4 text-sm text-ink focus:border-primary focus:outline-none" />
          </div>
          <button className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">Go</button>
        </div>
      </div>
    </form>
  );
}
