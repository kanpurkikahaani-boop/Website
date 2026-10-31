import { Parser } from "htmlparser2";

/**
 * Shared link verification (weekly cron + scripts/check-links.ts).
 * HEAD first, GET fallback, 10 s timeout, redirects followed. Nothing is ever auto-removed —
 * results are only reported.
 */
const UA = "Mozilla/5.0 (compatible; KanpurKiKahaaniBot/1.0; +https://kanpurkikahaani.site)";

export type LinkStatus = "ok" | "broken" | "blocked" | "skipped";

export interface LinkResult {
  url: string;
  status: LinkStatus;
  code: number | null;
  finalUrl?: string;
  note?: string;
}

/** Hosts we never fetch automatically (BookMyShow: no scraping, per site policy). */
const NEVER_FETCH = [/(^|\.)bookmyshow\.com$/i];

async function attempt(url: string, method: "HEAD" | "GET") {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: ctrl.signal,
      cache: "no-store",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8" },
    });
    const body = method === "GET" ? await res.text().catch(() => "") : "";
    return { code: res.status, finalUrl: res.url, body };
  } finally {
    clearTimeout(t);
  }
}

export async function checkUrl(url: string, opts: { wantBody?: boolean } = {}): Promise<LinkResult & { body?: string }> {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return { url, status: "broken", code: null, note: "invalid URL" };
  }
  if (NEVER_FETCH.some((re) => re.test(host))) return { url, status: "skipped", code: null, note: "not fetched by policy — check by hand" };
  try {
    let r = opts.wantBody ? await attempt(url, "GET") : await attempt(url, "HEAD").catch(() => null);
    if (!r || r.code >= 400) r = await attempt(url, "GET");
    const status: LinkStatus = r.code >= 200 && r.code < 300 ? "ok" : [401, 403, 429].includes(r.code) ? "blocked" : "broken";
    return {
      url,
      status,
      code: r.code,
      finalUrl: r.finalUrl !== url ? r.finalUrl : undefined,
      note: status === "blocked" ? "site refused the bot — check by hand" : undefined,
      body: opts.wantBody ? r.body : undefined,
    };
  } catch (e) {
    return { url, status: "broken", code: null, note: e instanceof Error ? (e.name === "AbortError" ? "timeout" : e.message) : "fetch failed" };
  }
}

/** Run `fn` over items with bounded concurrency. */
export async function pool<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

/** All hrefs in an HTML fragment. */
export function hrefsIn(html: string): string[] {
  const out: string[] = [];
  const p = new Parser({ onopentag: (name, attrs) => name === "a" && attrs.href && out.push(attrs.href) });
  p.write(html);
  p.end();
  return out;
}

interface PostLinkSource {
  content_html: string | null;
  plan_visit?: { url?: string }[] | null;
  glossary?: { url?: string }[] | null;
  further_reading?: { url?: string }[] | null;
}

/** Unique, absolute, checkable URLs a post links to (body + site boxes). Same-page #fragments are skipped. */
export function collectPostUrls(post: PostLinkSource, siteUrl: string): string[] {
  const raw = [
    ...hrefsIn(post.content_html ?? ""),
    ...[post.plan_visit, post.glossary, post.further_reading].flatMap((rows) => (rows ?? []).map((r) => r.url ?? "")),
  ];
  const set = new Set<string>();
  for (const h of raw) {
    if (!h || h.startsWith("#") || h.startsWith("mailto:") || h.startsWith("tel:")) continue;
    try {
      const u = new URL(h, siteUrl);
      if (u.protocol !== "https:" && u.protocol !== "http:") continue;
      u.hash = "";
      set.add(u.toString());
    } catch {
      set.add(h);
    }
  }
  return [...set];
}

export interface LinkReport {
  checkedAt: string;
  total: number;
  ok: number;
  broken: LinkResult[];
  blocked: LinkResult[];
  skipped: LinkResult[];
}

export async function checkPostLinks(post: PostLinkSource, siteUrl: string): Promise<LinkReport> {
  const urls = collectPostUrls(post, siteUrl);
  const results = await pool(urls, 6, (u) => checkUrl(u));
  return {
    checkedAt: new Date().toISOString(),
    total: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    broken: results.filter((r) => r.status === "broken"),
    blocked: results.filter((r) => r.status === "blocked"),
    skipped: results.filter((r) => r.status === "skipped"),
  };
}
