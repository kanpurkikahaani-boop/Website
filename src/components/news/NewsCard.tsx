import { ArrowUpRight } from "lucide-react";
import { CITY_LABELS, genreLabel, type NewsCity } from "@/lib/news/taxonomy";
import { hostOf } from "@/lib/news/normalize";
import type { NewsItem } from "@/lib/news/query";
import { formatIST } from "@/lib/news/query";
import { RelativeTime } from "./RelativeTime";

/** Headline, source, time and link only — never article text or article photos. */
export function NewsCard({ item }: { item: NewsItem }) {
  const host = hostOf(item.sourceHomepage ?? item.url);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(60,30,20,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-border bg-bg-alt py-1 pl-1 pr-3 text-xs font-semibold text-ink">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny publisher favicon, not rehosted */}
          <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`} alt="" width={18} height={18} loading="lazy" className="h-[18px] w-[18px] shrink-0 rounded-full bg-white" />
          <span className="truncate">{item.sourceName}</span>
        </span>
        <span className="shrink-0 text-xs text-muted">
          <RelativeTime iso={item.publishedAt} fallback={formatIST(item.publishedAt)} />
        </span>
      </div>
      <p className="eyebrow mt-4 text-[10.5px]">
        {CITY_LABELS[item.city as NewsCity]?.en ?? item.city} · {genreLabel(item.genre)}
      </p>
      <h3 lang={item.language === "hi" ? "hi" : "en"} className={`mt-1.5 text-[18px] font-semibold leading-snug text-ink ${item.language === "hi" ? "font-deva" : ""}`}>
        {item.title}
      </h3>
      {item.summary && <p lang={item.language === "hi" ? "hi" : "en"} className="mt-2 line-clamp-2 text-sm">{item.summary}</p>}
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="group mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary hover:text-primary-hover">
        Read on {item.sourceName}
        <ArrowUpRight size={15} aria-hidden className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </article>
  );
}
