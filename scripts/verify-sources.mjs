/**
 * Verifies every candidate news feed and newspaper-directory URL, and writes ONLY the ones that
 * pass to src/data/news-sources.verified.json (the file the site uses).
 *
 *   npm run verify:sources            # needs open network access to the publishers
 *
 * Feed passes: HTTP 200 + parses as RSS/Atom with rss-parser + at least 1 item.
 * Directory link passes: final HTTP status 200 (after redirects).
 */
import { readFileSync, writeFileSync } from "node:fs";
import Parser from "rss-parser";

const UA = "KanpurKiKahaaniBot/1.0 (+https://kanpurkikahaani.site)";
const TIMEOUT = 15000;
const cand = JSON.parse(readFileSync("scripts/news-candidates.json", "utf8"));
const parser = new Parser();

const CITIES = {
  kanpur: { en: "Kanpur", hi: "कानपुर" },
  lucknow: { en: "Lucknow", hi: "लखनऊ" },
  agra: { en: "Agra", hi: "आगरा" },
  prayagraj: { en: "Prayagraj", hi: "प्रयागराज" },
  varanasi: { en: "Varanasi", hi: "वाराणसी" },
  ayodhya: { en: "Ayodhya", hi: "अयोध्या" },
};
const GENRE_QUERY = {
  "local-news": { en: "", hi: "" },
  politics: { en: "politics", hi: "राजनीति" },
  business: { en: "business", hi: "कारोबार" },
  economy: { en: "economy", hi: "अर्थव्यवस्था" },
  sports: { en: "sports", hi: "खेल" },
  entertainment: { en: "entertainment", hi: "मनोरंजन" },
  education: { en: "education", hi: "शिक्षा" },
  "crime-safety": { en: "crime police", hi: "अपराध पुलिस" },
  "lifestyle-culture": { en: "festival culture", hi: "त्योहार संस्कृति" },
  "weather-environment": { en: "weather", hi: "मौसम" },
};

function googleNews(city, genre, lang) {
  const q = `${CITIES[city][lang]} ${GENRE_QUERY[genre][lang]}`.trim() + " when:3d";
  const loc = lang === "en" ? "hl=en-IN&gl=IN&ceid=IN:en" : "hl=hi&gl=IN&ceid=IN:hi";
  return {
    name: "Google News",
    homepage: "https://news.google.com",
    feedUrl: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&${loc}`,
    language: lang,
    scope: "aggregator",
    city,
    genre,
  };
}

// Expand candidates
const feeds = [...cand.feeds];
const directory = [...cand.directory];
for (const [city, slug] of Object.entries(cand.cityEditions.slugs)) {
  for (const f of cand.cityEditions.feeds) {
    feeds.push({ name: `${f.name} — ${CITIES[city].hi}`, homepage: f.homepage.replace("{slug}", slug), feedUrl: f.feedUrl.replace("{slug}", slug), language: f.language, scope: "regional", city });
    directory.push({ group: city, name: `${f.name} — ${CITIES[city].en}`, url: f.homepage.replace("{slug}", slug) });
  }
}
for (const city of Object.keys(CITIES)) for (const genre of Object.keys(GENRE_QUERY)) for (const lang of ["en", "hi"]) feeds.push(googleNews(city, genre, lang));

async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5" }, redirect: "follow", signal: ctrl.signal });
    return { status: res.status, body: await res.text(), finalUrl: res.url };
  } finally {
    clearTimeout(t);
  }
}

async function checkFeed(f) {
  try {
    const r = await get(f.feedUrl);
    if (r.status !== 200) return { ok: false, reason: `HTTP ${r.status}` };
    const parsed = await parser.parseString(r.body);
    const n = parsed.items?.length ?? 0;
    return n > 0 ? { ok: true, items: n } : { ok: false, reason: "no items" };
  } catch (e) {
    return { ok: false, reason: e.name === "AbortError" ? "timeout" : String(e.message).slice(0, 120) };
  }
}

async function checkPage(d) {
  try {
    const r = await get(d.url);
    return r.status === 200 ? { ok: true } : { ok: false, reason: `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, reason: e.name === "AbortError" ? "timeout" : String(e.message).slice(0, 120) };
  }
}

async function pool(items, fn, n = 8) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }));
  return out;
}

const now = new Date().toISOString();
const feedResults = await pool(feeds, checkFeed);
const dirResults = await pool(directory, checkPage);

const okFeeds = feeds.filter((_, i) => feedResults[i].ok).map((f) => ({ ...f, active: true, verifiedAt: now }));
const okDir = directory.filter((_, i) => dirResults[i].ok).map((d) => ({ ...d, verifiedAt: now }));

const report = {
  checkedAt: now,
  feeds: feeds.map((f, i) => ({ name: f.name, url: f.feedUrl, ...feedResults[i] })),
  directory: directory.map((d, i) => ({ name: d.name, url: d.url, ...dirResults[i] })),
};
writeFileSync("scripts/verify-sources-report.json", JSON.stringify(report, null, 2) + "\n");

if (okFeeds.length === 0 && okDir.length === 0) {
  console.error("Nothing verified (is the network blocked?). Leaving src/data/news-sources.verified.json unchanged.");
  process.exit(1);
}
writeFileSync(
  "src/data/news-sources.verified.json",
  JSON.stringify({ verifiedAt: now, feeds: okFeeds, directory: okDir }, null, 2) + "\n",
);

const nf = feeds.length - okFeeds.length;
const nd = directory.length - okDir.length;
console.log(`Feeds: ${okFeeds.length} verified, ${nf} dropped. Directory: ${okDir.length} verified, ${nd} dropped.`);
for (const r of report.feeds.filter((x) => !x.ok)) console.log(`  ✗ feed ${r.name}: ${r.reason}  ${r.url}`);
for (const r of report.directory.filter((x) => !x.ok)) console.log(`  ✗ link ${r.name}: ${r.reason}  ${r.url}`);
