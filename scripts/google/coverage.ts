/**
 * npm run google:coverage (runs in prebuild). Fails if any item lacks a Map or Photos link, a link
 * has the wrong shape, a query is missing its city, or a Google URL is hand-typed outside
 * src/lib/googleLinks.ts. Lists (without failing) Maps queries shared by differently named items.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { collect } from "./collect";

const MAPS = /^https:\/\/www\.google\.com\/maps\/(search\/\?api=1&query=|dir\/\?api=1&origin=)/;
const IMAGES = /^https:\/\/www\.google\.com\/search\?q=[^&]+&udm=2$/;

const rows = collect();
const errors: string[] = [];
const warnings: string[] = [];
const norm = (s: string) => s.toLowerCase().replace(/\s*\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();

for (const r of rows) {
  const { item } = r;
  const where = `${r.page} › ${r.section} › ${item.name}`;
  if (!item.mapsUrl || !MAPS.test(item.mapsUrl)) errors.push(`${where}: bad or missing Maps link (${item.mapsUrl})`);
  if (!item.imagesUrl || !IMAGES.test(item.imagesUrl)) errors.push(`${where}: bad or missing Photos link (${item.imagesUrl})`);
  const city = r.expectCity.toLowerCase();
  const mapsText = decodeURIComponent(item.mapsUrl.replace(/\+/g, " ")).toLowerCase();
  if (!mapsText.includes(city)) errors.push(`${where}: Maps link doesn't name ${r.expectCity}`);
  if (!item.imagesQuery.toLowerCase().includes(city)) errors.push(`${where}: Photos query "${item.imagesQuery}" doesn't name ${r.expectCity}`);
}

// Same Maps query for items with different names (fine for areas, worth a look otherwise).
const byQuery = new Map<string, Set<string>>();
for (const r of rows) if (r.item.mapsKind !== "directions") byQuery.set(r.item.mapsQuery, (byQuery.get(r.item.mapsQuery) ?? new Set()).add(norm(r.item.name)));
for (const [q, names] of byQuery) if (names.size > 1) warnings.push(`"${q}" is shared by: ${[...names].join(" / ")}`);

// No Google URLs anywhere else in the source.
const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(path.join(dir, n)).isDirectory() ? walk(path.join(dir, n)) : [path.join(dir, n)]));
for (const f of walk("src").filter((f) => /\.(tsx?|mjs)$/.test(f))) {
  if (f.endsWith(path.join("lib", "googleLinks.ts"))) continue;
  const text = readFileSync(f, "utf8");
  if (/https?:\/\/(www\.)?google\.[a-z.]+\//.test(text)) errors.push(`${f}: hand-typed Google URL (use src/lib/googleLinks.ts)`);
}

for (const w of warnings) console.warn(`⚠ shared Maps query ${w}`);
for (const e of errors) console.error(`✗ ${e}`);
const pages = new Set(rows.map((r) => r.page)).size;
console.log(`google:coverage — ${rows.length} items on ${pages} pages · ${errors.length} error(s) · ${warnings.length} shared quer${warnings.length === 1 ? "y" : "ies"} to review`);
if (errors.length) process.exit(1);
