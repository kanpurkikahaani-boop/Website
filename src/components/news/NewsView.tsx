import Link from "next/link";
import { Newspaper } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/data/site";
import { formatIST, getLastUpdated, getNews, NEWS_PER_PAGE, type NewsFilters } from "@/lib/news/query";
import { CITY_LABELS, GENRES, NEWS_CITIES, type Genre, type NewsCity } from "@/lib/news/taxonomy";
import { cn } from "@/lib/utils";
import { FilterBar } from "./FilterBar";
import { NewsCard } from "./NewsCard";
import { NewspaperDirectory } from "./NewspaperDirectory";

/** Shared body of /news and the /news/[city]/[genre] landing pages. */
export async function NewsView({
  filters,
  path,
  pageTitle,
  landing,
}: {
  filters: NewsFilters & { page: number };
  path: string;
  pageTitle: string;
  /** On landing pages "Load more" continues on /news with the same filters. */
  landing?: boolean;
}) {
  const [{ items, total, failed }, lastUpdated] = await Promise.all([getNews(filters), getLastUpdated()]);
  const { city = "", genre = "", lang = "", q = "", page } = filters;
  const more = items.length < total;
  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ city, genre, lang, q, ...patch })) if (v) p.set(k, v);
    return `/news?${p}`;
  };

  return (
    <>
      <FilterBar city={city} genre={genre} lang={lang} q={q} />
      <p className="mt-3 text-xs text-muted" aria-live="polite">
        {lastUpdated ? <>Last updated: {formatIST(lastUpdated)}</> : "Headlines refresh every morning at 6:00 AM IST."}
        {total > 0 && <> · {total} headline{total === 1 ? "" : "s"}</>}
      </p>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-border bg-surface px-6 py-14 text-center">
          <Newspaper size={36} className="text-accent" aria-hidden />
          <h2 className="mt-3 text-2xl font-bold text-primary">
            {failed || !lastUpdated ? "Fresh headlines are on their way." : "No headlines match these filters right now."}
          </h2>
          <p className="mt-2 max-w-md text-sm">
            {failed || !lastUpdated
              ? "Our daily news refresh runs every morning. Meanwhile, read the newspapers we follow below."
              : "Try another city, genre or language — or browse the newspapers we follow below."}
          </p>
          {(city || genre || lang || q) && (
            <Link href="/news" className="mt-5 rounded-full border border-border px-5 py-2 text-sm font-semibold text-ink hover:border-primary">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <li key={it.url}>
                <NewsCard item={it} />
              </li>
            ))}
          </ul>
          {more && (
            <div className="mt-10 text-center">
              <Link href={qs({ page: String(landing ? 2 : page + 1) })} scroll={false} rel="nofollow" className="inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white hover:bg-primary-hover">
                Load more headlines
              </Link>
              <p className="mt-2 text-xs text-muted">Showing {items.length} of {total} · {NEWS_PER_PAGE} more per click</p>
            </div>
          )}
        </>
      )}

      <RelatedLinks city={city as NewsCity | ""} genre={genre as Genre | ""} />
      <NewspaperDirectory />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: pageTitle,
          url: absoluteUrl(path),
          inLanguage: ["en-IN", "hi-IN"],
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.slice(0, 24).map((it, i) => ({ "@type": "ListItem", position: i + 1, url: it.url, name: it.title })),
          },
        }}
      />
    </>
  );
}

/** Internal links between sibling landing pages and the matching city guide. */
function RelatedLinks({ city, genre }: { city: NewsCity | ""; genre: Genre | "" }) {
  const pill = "rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink hover:border-primary hover:text-primary";
  return (
    <nav aria-label="Browse news by city and topic" className="mt-14 grid gap-6 rounded-2xl bg-bg-alt p-6 md:grid-cols-2">
      <div>
        <h2 className="text-lg font-semibold">{city ? `More ${CITY_LABELS[city].en} topics` : "News by city"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {city
            ? GENRES.map((g) => (
                <Link key={g.slug} href={`/news/${city}/${g.slug}`} className={cn(pill, genre === g.slug && "border-primary bg-primary text-white hover:text-white")}>
                  {g.label}
                </Link>
              ))
            : NEWS_CITIES.map((c) => (
                <Link key={c} href={`/news/${c}`} className={pill}>{CITY_LABELS[c].en}</Link>
              ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold">{genre ? "Same topic, other cities" : "Explore the city"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {genre
            ? NEWS_CITIES.filter((c) => c !== city).map((c) => (
                <Link key={c} href={`/news/${c}/${genre}`} className={pill}>{CITY_LABELS[c].en}</Link>
              ))
            : null}
          {city ? (
            <Link href={city === "kanpur" ? "/tourism" : `/cities/${city}`} className={cn(pill, "border-primary/40 text-primary")}>
              {CITY_LABELS[city].en} travel guide →
            </Link>
          ) : (
            <Link href="/nearby" className={cn(pill, "border-primary/40 text-primary")}>Trips beyond Kanpur →</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
