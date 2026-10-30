import Parser from "rss-parser";
import type { NewsSource } from "@/data/newsSources";
import { classifyCity, classifyGenre } from "./classify";
import { canonicalUrl, cleanTitle, hostOf, shortSummary, urlHash } from "./normalize";
import type { NewsCity } from "./taxonomy";

export const KEEP_DAYS = 30;

export type FeedItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
  pubDate?: string;
  categories?: (string | { _: string })[];
  /** Google News `<source url="publisher">Publisher</source>` (array via keepArray) */
  source?: { _?: string; $?: { url?: string } }[] | string;
};

export const parser: Parser<object, FeedItem> = new Parser({ customFields: { item: [["source", "source", { keepArray: true }]] } });

export interface NewsRow {
  url: string;
  url_hash: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_homepage: string | null;
  language: "en" | "hi";
  city: NewsCity;
  genre: string;
  published_at: string;
  fetched_at: string;
}

/**
 * Turn one feed item into a row we're allowed to store: headline, source, time, link and at most a
 * ~140-char line from the feed's own description. Never article bodies, never images.
 */
export function toRow(item: FeedItem, src: NewsSource, now: Date): NewsRow | null {
  if (!item.link || !item.title) return null;
  // Google News: credit the original publisher named in <source>
  const srcTag = Array.isArray(item.source) ? item.source[0] : undefined;
  const publisher = src.scope === "aggregator" && srcTag?._ ? srcTag._ : src.name;
  const publisherHome = src.scope === "aggregator" && srcTag?.$?.url ? srcTag.$.url : src.homepage;

  const url = canonicalUrl(item.link);
  if (!url) return null;
  const title = cleanTitle(item.title, publisher);
  const desc = item.contentSnippet ?? item.content;
  const summary = shortSummary(desc, title);
  const categories = (item.categories ?? []).map((c) => (typeof c === "string" ? c : c._)).filter(Boolean);

  const city = classifyCity(`${title} ${summary ?? ""}`, src.city);
  if (!city) return null; // national story about none of our cities
  const genre = classifyGenre(`${title} ${summary ?? ""}`, categories, src.genre);

  const published = new Date(item.isoDate ?? item.pubDate ?? now);
  const publishedAt = Number.isNaN(published.getTime()) || published > now ? now : published;
  if (now.getTime() - publishedAt.getTime() > KEEP_DAYS * 864e5) return null;

  return {
    url,
    url_hash: urlHash(url),
    title,
    summary,
    source_name: publisher,
    source_homepage: publisherHome ? `https://${hostOf(publisherHome)}` : null,
    language: src.language,
    city,
    genre,
    published_at: publishedAt.toISOString(),
    fetched_at: now.toISOString(),
  };
}

