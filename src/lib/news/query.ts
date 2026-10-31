import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { getLiveNews } from "./live";
import type { NewsRow } from "./to-row";
import { GENRE_SLUGS, NEWS_CITIES } from "./taxonomy";

export const NEWS_PER_PAGE = 24;

export interface NewsItem {
  url: string;
  title: string;
  summary: string | null;
  sourceName: string;
  sourceHomepage: string | null;
  language: "en" | "hi";
  city: string;
  genre: string;
  publishedAt: string;
}

export interface NewsFilters {
  city?: string;
  genre?: string;
  lang?: string;
  page?: number;
}

/** Only accept known values from the URL. */
export function cleanFilters(sp: Record<string, string | string[] | undefined>): Required<NewsFilters> {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  return {
    city: (NEWS_CITIES as readonly string[]).includes(s("city")) ? s("city") : "",
    genre: (GENRE_SLUGS as string[]).includes(s("genre")) ? s("genre") : "",
    lang: ["en", "hi"].includes(s("lang")) ? s("lang") : "",
    page: Math.max(1, Math.min(50, Math.floor(Number(s("page"))) || 1)),
  };
}

/** Has the daily cron stored headlines in Supabase? (Otherwise we read the feeds live.) */
const getDbRun = cache(async () => {
  const db = createPublicClient();
  if (!db) return null;
  const { data, error } = await db.from("news_runs").select("finished_at").eq("ok", true).gt("items_upserted", 0).order("finished_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data?.finished_at) return null;
  return { db, finishedAt: data.finished_at as string };
});

const fromRow = (r: Pick<NewsRow, "url" | "title" | "summary" | "source_name" | "source_homepage" | "language" | "city" | "genre" | "published_at">): NewsItem => ({
  url: r.url,
  title: r.title,
  summary: r.summary,
  sourceName: r.source_name,
  sourceHomepage: r.source_homepage,
  language: r.language,
  city: r.city,
  genre: r.genre,
  publishedAt: r.published_at,
});

/** Headlines for a filter combination: from Supabase when the cron has run, else live from the feeds. */
export async function getNews({ city, genre, lang, page = 1 }: NewsFilters) {
  const limit = page * NEWS_PER_PAGE; // "Load more" shows everything up to this page
  const run = await getDbRun();
  if (run) {
    let query = run.db
      .from("news_items")
      .select("url, title, summary, source_name, source_homepage, language, city, genre, published_at", { count: "exact" })
      .order("published_at", { ascending: false })
      .range(0, limit - 1);
    if (city) query = query.eq("city", city);
    if (genre) query = query.eq("genre", genre);
    if (lang) query = query.eq("language", lang);
    const { data, count, error } = await query;
    if (!error) return { items: (data ?? []).map((r) => fromRow(r as NewsRow)), total: count ?? 0, failed: false };
    console.error("[news] query failed, falling back to live feeds:", error.message);
  }
  try {
    const live = await getLiveNews();
    const rows = live.rows.filter((r) => (!city || r.city === city) && (!genre || r.genre === genre) && (!lang || r.language === lang));
    return { items: rows.slice(0, limit).map(fromRow), total: rows.length, failed: live.feedsOk === 0 };
  } catch (e) {
    console.error("[news] live fetch failed:", e);
    return { items: [] as NewsItem[], total: 0, failed: true };
  }
}

/** When the headlines were last refreshed (cron run, or the live fetch). */
export async function getLastUpdated(): Promise<string | null> {
  const run = await getDbRun();
  if (run) return run.finishedAt;
  try {
    const live = await getLiveNews();
    return live.feedsOk > 0 ? live.fetchedAt : null;
  } catch {
    return null;
  }
}

export function formatIST(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) + " IST";
}
