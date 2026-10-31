import "server-only";
import { unstable_cache } from "next/cache";
import { activeSources } from "@/data/newsSources";
import { fetchFeed } from "./fetch-feed";
import { toRow, type NewsRow } from "./to-row";

/**
 * Fallback used until Supabase + the daily cron are set up: fetch every top-newspaper feed
 * directly, keep only feeds that respond with valid RSS, and cache the merged result for an hour.
 * Same fair-use rules as the cron: headline, source, time, link and ≤140-char summary only.
 */
export const getLiveNews = unstable_cache(
  async (): Promise<{ rows: NewsRow[]; fetchedAt: string; feedsOk: number; feedsFailed: number }> => {
    const sources = activeSources();
    const now = new Date();
    const settled = await Promise.allSettled(sources.map((s) => fetchFeed(s, { revalidate: 3600 })));
    const byUrl = new Map<string, NewsRow>();
    let ok = 0;
    settled.forEach((r, i) => {
      if (r.status !== "fulfilled") return;
      ok++;
      for (const item of r.value.items ?? []) {
        const row = toRow(item, sources[i], now);
        if (row && !byUrl.has(row.url)) byUrl.set(row.url, row);
      }
    });
    const rows = [...byUrl.values()].sort((a, b) => b.published_at.localeCompare(a.published_at)).slice(0, 1500);
    return { rows, fetchedAt: now.toISOString(), feedsOk: ok, feedsFailed: sources.length - ok };
  },
  ["live-news-v1"],
  { revalidate: 3600, tags: ["news"] },
);
