import type { NewsSource } from "@/data/newsSources";
import { parser } from "./to-row";

const UA = "KanpurKiKahaaniBot/1.0 (+https://kanpurkikahaani.site)";
const FEED_TIMEOUT_MS = 10_000;

/**
 * Fetch and parse one feed. Throws on timeout, non-200 or invalid XML — callers use
 * Promise.allSettled so a dead feed is simply skipped (that's the live verification).
 * `revalidate` (seconds) lets the no-database fallback reuse results from Next's data cache.
 */
export async function fetchFeed(src: NewsSource, opts: { revalidate?: number } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FEED_TIMEOUT_MS);
  try {
    const res = await fetch(src.feedUrl, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
      signal: ctrl.signal,
      ...(opts.revalidate ? { next: { revalidate: opts.revalidate } } : { cache: "no-store" as const }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await parser.parseString(await res.text());
  } finally {
    clearTimeout(timer);
  }
}
