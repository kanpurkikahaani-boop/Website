/**
 * npm run seo:faq — keyword coverage for the site FAQs (update v8) → reports/faq-keyword-coverage.md
 *
 *  - For each target keyword: the pages and questions that use it. Uncovered keywords are errors
 *    (except the misspellings "wea" and "itenary", which must never be written anywhere).
 *  - For each page: FAQ count and keyword uses, counted over the FAQ questions + answers, the FAQ
 *    heading and the page's own meta title/description/headings. Warn above 3 uses.
 *  - Answers under 40 or over 100 words, or with no internal link, are warnings.
 *
 * Counting: an occurrence fully inside a longer keyword occurrence isn't counted again, so
 * "weather today at my location" is not also "weather today" or "weather". "kanpur" is the site's topic and brand name — it is on
 * every page by necessity — so it is reported but exempt from the per-page cap.
 *
 * Exit code: 1 on errors (uncovered keyword, misspelling found), else 0. `--warn-only` (used in
 * prebuild) always exits 0 and just prints.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { allFaqGroups } from "../../src/data/faqs";

export const KEYWORDS = `kanpur, itinerary, culture, map, weather, events, news,
kanpur city, kanpur india, kanpur iit, night out, upcoming festival,
weather tomorrow, weather radar, weather today, radar, local weather, weather forecast,
live weather radar, forecast, weather report, the weather, local weather forecast, rain radar,
live weather, weather near me, weather today at my location, weather update, weather news,
rain today, weather tomorrow at my location, rain forecast, weather now, current weather,
temperature today, my weather, rain weather today at my location, weather update today,
temperature now, weather information, weather conditions, weather report today,
weather tomorrow rain, weather forecast for tomorrow, weather right now, live temperature,
weather in my location, weather temperature, weather rain, current temperature,
weather report today in my location, temperature today at my location, weather location,
weather today rain`
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);
const MISSPELLINGS = ["itenary", "wea"];
const EXEMPT_FROM_CAP = new Set(["kanpur"]);
const CAP = 3;

export const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // markdown links → their words
    .replace(/'s\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

const phrases = KEYWORDS.map((k) => ({ k, w: words(k) })).sort((a, b) => b.w.length - a.w.length);

/**
 * Keyword counts in a text. Every occurrence of every keyword is found; when two occurrences
 * overlap, only the longer counts (on a tie, the later one), so "weather today at my location" is
 * not also "weather today" or "weather", and "the weather today" counts as "weather today".
 */
export function countKeywords(text: string): Map<string, number> {
  const out = new Map<string, number>();
  // Never match across sentence or clause breaks ("…in Kanpur? IIT Kanpur" is not "kanpur iit").
  for (const part of text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").split(/[.?!;:()—–]+/)) for (const [k, n] of countIn(part)) out.set(k, (out.get(k) ?? 0) + n);
  return out;
}

function countIn(text: string): Map<string, number> {
  const w = words(text);
  const hits: { k: string; a: number; b: number }[] = [];
  for (let i = 0; i < w.length; i++) for (const p of phrases) if (p.w.every((x, j) => w[i + j] === x)) hits.push({ k: p.k, a: i, b: i + p.w.length });
  const out = new Map<string, number>();
  for (const h of hits) {
    const len = h.b - h.a;
    // Drop h if another hit overlaps it and is longer, or equally long but starts later
    // ("the weather today" reads as "weather today", not "the weather").
    const covered = hits.some((o) => o !== h && o.a < h.b && h.a < o.b && (o.b - o.a > len || (o.b - o.a === len && o.a > h.a)));
    if (!covered) out.set(h.k, (out.get(h.k) ?? 0) + 1);
  }
  return out;
}

const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
const wordCount = (s: string) => plain(s).split(/\s+/).filter(Boolean).length;

/** Meta title, description and literal headings from a page file (best effort, regex). */
function pageMeta(route: string): string {
  const dir = route === "/" ? "src/app" : path.join("src/app", route);
  const file = path.join(dir, "page.tsx");
  if (!existsSync(file)) return "";
  const src = readFileSync(file, "utf8");
  const grab = (re: RegExp) => [...src.matchAll(re)].map((m) => m[1]);
  return [
    ...grab(/\btitle:\s*"([^"]+)"/g),
    ...grab(/\bdescription:\s*\n?\s*"([^"]+)"/g),
    ...grab(/<SectionHeader[^>]*\btitle="([^"]+)"/g),
    ...grab(/<PageHero[^>]*\btitle="([^"]+)"/g),
  ].join(". ");
}

function scanForMisspellings(): string[] {
  const hits: string[] = [];
  const roots = ["src", "content", "public"];
  const walk = (p: string) => {
    for (const name of readdirSync(p)) {
      const f = path.join(p, name);
      if (statSync(f).isDirectory()) walk(f);
      else if (/\.(tsx?|mdx?|html|json|txt|css|svg)$/.test(name)) {
        const t = readFileSync(f, "utf8").toLowerCase();
        for (const m of MISSPELLINGS) if (new RegExp(`\\b${m}\\b`).test(t)) hits.push(`${f}: "${m}"`);
      }
    }
  };
  roots.filter(existsSync).forEach(walk);
  return hits;
}

function main() {
  const warnOnly = process.argv.includes("--warn-only");
  const groups = allFaqGroups();
  const errors: string[] = [];
  const warnings: string[] = [];
  const coverage = new Map<string, { page: string; q: string }[]>(KEYWORDS.map((k) => [k, []]));
  const pageRows: string[] = [];

  for (const g of groups) {
    const meta = g.key.startsWith("city-") ? "" : pageMeta(g.path);
    const faqText = g.items.map((f) => `${f.question}. ${f.answer}`).join(" ");
    const totals = countKeywords(`${g.title}. ${meta}. ${faqText}`);
    for (const f of g.items) {
      for (const k of countKeywords(`${f.question}. ${f.answer}`).keys()) coverage.get(k)!.push({ page: g.path, q: f.question });
      const n = wordCount(f.answer);
      if (n < 40 || n > 100) warnings.push(`${g.path} · "${f.question}" — ${n} words`);
      if (!/\]\((\/|#)/.test(f.answer)) warnings.push(`${g.path} · "${f.question}" — no internal link`);
    }
    const over = [...totals].filter(([k, n]) => n > CAP && !EXEMPT_FROM_CAP.has(k));
    for (const [k, n] of over) warnings.push(`${g.path} · "${k}" used ${n}× (max ${CAP})`);
    const uses = [...totals].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}${n > CAP && !EXEMPT_FROM_CAP.has(k) ? " ⚠" : ""}`);
    pageRows.push(`| \`${g.path}\` | ${g.items.length} | ${uses.join(", ") || "—"} |`);
  }

  const uncovered = KEYWORDS.filter((k) => !coverage.get(k)!.length);
  for (const k of uncovered) errors.push(`Keyword not covered by any FAQ: "${k}"`);
  for (const h of scanForMisspellings()) errors.push(`Misspelling found: ${h}`);

  const md = [
    "# FAQ keyword coverage",
    "",
    `Generated by \`npm run seo:faq\` (scripts/seo/faq-coverage.ts). ${groups.reduce((n, g) => n + g.items.length, 0)} FAQs on ${groups.length} pages · ${KEYWORDS.length - uncovered.length}/${KEYWORDS.length} keywords covered · ${warnings.length} warning(s) · ${errors.length} error(s).`,
    "",
    "Counting: a keyword occurrence fully inside a longer keyword occurrence is not counted again (“weather today at my location” is not also “weather today” or “weather”). Per-page totals include the FAQ heading and the page's meta title, description and literal headings. “kanpur” is the site's topic and brand, so it is exempt from the cap. The misspellings people type (\"wea\", \"itenary\") are intentionally never written; this check fails if either appears anywhere in src/, content/ or public/.",
    "",
    ...(errors.length ? ["## Errors", "", ...errors.map((e) => `- ${e}`), ""] : []),
    ...(warnings.length ? ["## Warnings", "", ...warnings.map((w) => `- ${w}`), ""] : ["## Warnings", "", "None.", ""]),
    "## Keywords",
    "",
    "| Keyword | Uses | Pages | Example question |",
    "|---|---|---|---|",
    ...KEYWORDS.map((k) => {
      const c = coverage.get(k)!;
      const pages = [...new Set(c.map((x) => x.page))];
      return `| ${k} | ${c.length} | ${pages.map((p) => `\`${p}\``).join(", ") || "**uncovered**"} | ${c[0]?.q ?? "—"} |`;
    }),
    "",
    "## Pages",
    "",
    "| Page | FAQs | Keyword uses (FAQ + heading + meta) |",
    "|---|---|---|",
    ...pageRows,
    "",
  ].join("\n");
  mkdirSync("reports", { recursive: true });
  writeFileSync("reports/faq-keyword-coverage.md", md);

  for (const e of errors) console.error(`✗ ${e}`);
  for (const w of warnings) console.warn(`⚠ ${w}`);
  console.log(`seo:faq — ${KEYWORDS.length - uncovered.length}/${KEYWORDS.length} keywords covered, ${warnings.length} warning(s), ${errors.length} error(s) → reports/faq-keyword-coverage.md`);
  if (errors.length && !warnOnly) process.exit(1);
}

if (process.argv[1]?.endsWith("faq-coverage.ts")) main();
